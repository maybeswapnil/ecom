"use client";

import Image from "next/image";
import Script from "next/script";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore, cartSubtotalPaise } from "@/lib/cart-store";
import { useHydrated } from "@/lib/use-hydrated";
import { formatPaise } from "@/lib/money";
import { BRAND_NAME, FREE_SHIP_THRESHOLD_PAISE, SHIPPING_FLAT_PAISE } from "@/lib/config";
import { useShippingOffer } from "@/lib/use-shipping-offer";
import {
  checkoutFormSchema,
  INDIAN_STATE_LIST,
  type CheckoutFormErrors,
} from "@/lib/validation";

function generateIdempotencyKey(): string {
  return typeof crypto !== "undefined" ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export function CheckoutForm() {
  const router = useRouter();
  const lines = useCartStore((s) => s.lines);
  const clear = useCartStore((s) => s.clear);
  const hydrated = useHydrated();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CheckoutFormErrors>({});
  const [scriptReady, setScriptReady] = useState(false);

  const [form, setForm] = useState({
    email: "",
    phoneLocal: "",
    name: "",
    line1: "",
    city: "",
    state: "MH",
    pincode: "",
  });

  const shippingOffer = useShippingOffer();

  const subtotal = hydrated ? cartSubtotalPaise(lines) : 0;
  // Compiled defaults until the live offer loads — the same values the server fails closed to.
  // A stale quote can't mischarge: /api/checkout recomputes and 409s on expected_total mismatch.
  const threshold = shippingOffer ? shippingOffer.thresholdPaise : FREE_SHIP_THRESHOLD_PAISE;
  const flatPaise = shippingOffer ? shippingOffer.flatPaise : SHIPPING_FLAT_PAISE;
  const freeReached = threshold !== null && subtotal >= threshold && subtotal > 0;
  const shippingCost = subtotal === 0 || freeReached ? 0 : flatPaise;
  const total = subtotal + shippingCost;

  const [idempotencyKey] = useState(generateIdempotencyKey);

  function updateField(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (fieldErrors[key as keyof CheckoutFormErrors]) {
      setFieldErrors((errs) => ({ ...errs, [key]: undefined }));
    }
  }

  async function handlePay() {
    setErrorMsg(null);

    const parsed = checkoutFormSchema.safeParse(form);
    if (!parsed.success) {
      const errs: CheckoutFormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof CheckoutFormErrors;
        if (!errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      setErrorMsg("Please fix the highlighted fields below.");
      return;
    }
    setFieldErrors({});
    setSubmitting(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotency_key: idempotencyKey,
          items: lines.map((l) => ({ sku: l.sku, qty: l.qty })),
          customer: {
            name: parsed.data.name,
            email: parsed.data.email,
            phone: `+91${parsed.data.phoneLocal}`,
          },
          address: {
            line1: parsed.data.line1,
            line2: "",
            city: parsed.data.city,
            state: parsed.data.state,
            pincode: parsed.data.pincode,
          },
          expected_total_paise: total,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data?.error?.message ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      if (!data.razorpay?.order_id || !scriptReady || !window.Razorpay) {
        setErrorMsg(
          "Payments are not fully configured yet for this store. Your order has been recorded as pending."
        );
        setSubmitting(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: data.razorpay.key_id,
        amount: data.amount_paise,
        currency: "INR",
        order_id: data.razorpay.order_id,
        name: BRAND_NAME,
        prefill: data.prefill,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          clear();
          router.push(`/order/${data.order_number}?t=${data.receipt_token}`);
        },
        modal: {
          ondismiss: () => setSubmitting(false),
        },
      });
      rzp.open();
    } catch {
      setErrorMsg("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  if (!hydrated) return null;

  if (lines.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="font-display italic text-xl text-muted mb-6">
          Your cart is empty — add a print before checking out.
        </div>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptReady(true)}
      />
      <div className="flex flex-col-reverse md:flex-row gap-9 md:gap-14 items-start">
        <div className="flex-1 min-w-0 flex flex-col gap-11">
          {/* 01 Contact */}
          <div>
            <div className="text-[11px] tracking-[0.24em] uppercase text-muted font-semibold mb-4.5 pb-2.5 border-b border-hairline">
              01 — Contact
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <Field label="Email" error={fieldErrors.email}>
                <input
                  type="email"
                  inputMode="email"
                  placeholder="you@email.com"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className={inputClass(!!fieldErrors.email)}
                />
              </Field>
              <Field label="Phone" error={fieldErrors.phoneLocal}>
                <div className="flex">
                  <span className="flex items-center px-3.5 h-12 border border-r-0 border-border-input bg-surface-sunken rounded-l-md text-[15px] text-muted font-medium">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="tel"
                    placeholder="10-digit number"
                    value={form.phoneLocal}
                    maxLength={10}
                    onChange={(e) => updateField("phoneLocal", e.target.value.replace(/[^0-9]/g, ""))}
                    className={`${inputClass(!!fieldErrors.phoneLocal)} rounded-l-none border-l-0`}
                  />
                </div>
              </Field>
            </div>
          </div>

          {/* 02 Shipping address */}
          <div>
            <div className="text-[11px] tracking-[0.24em] uppercase text-muted font-semibold mb-4.5 pb-2.5 border-b border-hairline">
              02 — Shipping address
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <Field label="Full name" className="md:col-span-2" error={fieldErrors.name}>
                <input
                  type="text"
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className={inputClass(!!fieldErrors.name)}
                />
              </Field>
              <Field label="Address" className="md:col-span-2" error={fieldErrors.line1}>
                <input
                  type="text"
                  placeholder="Flat, building, street"
                  value={form.line1}
                  onChange={(e) => updateField("line1", e.target.value)}
                  className={inputClass(!!fieldErrors.line1)}
                />
              </Field>
              <Field label="City" error={fieldErrors.city}>
                <input
                  type="text"
                  placeholder="City"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  className={inputClass(!!fieldErrors.city)}
                />
              </Field>
              <Field label="State" error={fieldErrors.state}>
                <select
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  className={inputClass(!!fieldErrors.state)}
                >
                  {INDIAN_STATE_LIST.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Pincode" error={fieldErrors.pincode}>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="560001"
                  value={form.pincode}
                  maxLength={6}
                  onChange={(e) => updateField("pincode", e.target.value.replace(/[^0-9]/g, ""))}
                  className={inputClass(!!fieldErrors.pincode)}
                />
              </Field>
            </div>
          </div>

          {/* 03 Shipping method */}
          <div>
            <div className="text-[11px] tracking-[0.24em] uppercase text-muted font-semibold mb-4.5 pb-2.5 border-b border-hairline">
              03 — Shipping method
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between px-4.5 py-4 border border-ink rounded-md">
                <span className="flex items-center gap-3.5">
                  <span className="w-4 h-4 rounded-full bg-paper inline-block border-[5px] border-ink" />
                  <span>
                    <span className="font-medium text-sm">Standard — insured courier</span>
                    <br />
                    <span className="text-[12.5px] text-muted">5–7 business days</span>
                  </span>
                </span>
                <span className="font-display text-lg">
                  {freeReached ? "Free" : formatPaise(flatPaise)}
                </span>
              </div>
            </div>
          </div>

          {/* 04 Payment */}
          <div>
            <div className="text-[11px] tracking-[0.24em] uppercase text-muted font-semibold mb-4.5 pb-2.5 border-b border-hairline">
              04 — Payment
            </div>
            <div className="flex items-center gap-3.5 px-4.5 py-4 bg-surface-sunken rounded-lg">
              <span className="font-semibold text-[13px] tracking-[0.04em]">Razorpay</span>
              <span className="text-[12.5px] text-muted">
                UPI · Cards · Netbanking — secured &amp; encrypted. No account needed.
              </span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <aside className="flex-none w-full md:w-[340px] md:sticky md:top-[104px]">
          <div className="border border-hairline bg-surface rounded-xl p-6.5">
            <div className="font-display text-[22px] font-medium mb-4.5">Order summary</div>
            <div className="flex flex-col gap-3.5 mb-4.5">
              {lines.map((l) => (
                <div key={l.sku} className="flex items-center gap-3">
                  <div className="relative w-11 h-11 flex-none border border-hairline">
                    <Image src={l.snapshot.image} alt={l.snapshot.title} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 text-[13px] text-ink">
                    {l.snapshot.title}
                    <br />
                    <span className="text-faint text-xs">
                      {l.snapshot.sizeLabel} × {l.qty}
                    </span>
                  </div>
                  <span className="text-[13px] whitespace-nowrap">
                    {formatPaise(l.snapshot.pricePaise * l.qty)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-hairline pt-4 flex flex-col gap-2.5 text-[13.5px]">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span>{formatPaise(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Shipping</span>
                <span>{shippingCost === 0 ? "Free" : formatPaise(shippingCost)}</span>
              </div>
              <div className="flex justify-between items-baseline mt-2">
                <span className="font-semibold">Total</span>
                <span className="font-display text-[26px] font-medium">{formatPaise(total)}</span>
              </div>
            </div>
            {errorMsg && (
              <div className="mt-3 text-[12.5px] text-red-700" role="alert">
                {errorMsg}
              </div>
            )}
            <button
              onClick={handlePay}
              disabled={submitting}
              className="w-full h-[54px] mt-5 bg-ink text-paper rounded-md font-body font-medium text-[15px] cursor-pointer disabled:opacity-60 hover:bg-ink-soft"
            >
              {submitting ? "Processing…" : `Pay ${formatPaise(total)}`}
            </button>
            <div className="text-[11.5px] text-faint text-center mt-3 leading-relaxed">
              Guest checkout · order number &amp; tracking by email + SMS
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function inputClass(hasError: boolean): string {
  return `w-full h-12 px-3.5 border bg-surface rounded-md font-body text-[15px] text-ink focus:outline-none ${
    hasError ? "border-red-400 focus:border-red-500" : "border-border-input focus:border-ink"
  }`;
}

function Field({
  label,
  children,
  className = "",
  error,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  error?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[11px] tracking-[0.1em] uppercase text-faint block mb-1.5">
        {label}
      </span>
      {children}
      {error && <span className="block text-[12px] text-red-700 mt-1">{error}</span>}
    </label>
  );
}
