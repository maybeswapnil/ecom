"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPaise } from "@/lib/money";
import { CONFIRMATION_POLL_SECONDS } from "@/lib/config";

type Item = {
  title: string;
  sku: string;
  qty: number;
  unitPricePaise: number;
  sizeLabel: string | null;
  finish: string | null;
};

type Address = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
} | null;

const STEPS = ["Confirmed", "Printing", "Shipped", "Delivered"];
const STATUS_STEP: Record<string, number> = {
  pending: -1,
  paid: 0,
  packed: 1,
  shipped: 2,
  delivered: 3,
};

function formatOrderDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function OrderStatusView({
  orderNumber,
  token,
  initialStatus,
  createdAt,
  email,
  subtotalPaise,
  shippingPaise,
  totalPaise,
  address,
  items,
}: {
  orderNumber: string;
  token: string;
  initialStatus: string;
  createdAt: string;
  email: string;
  subtotalPaise: number;
  shippingPaise: number;
  totalPaise: number;
  address: Address;
  items: Item[];
}) {
  const [status, setStatus] = useState(initialStatus);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (status !== "pending") return;

    let elapsed = 0;
    const interval = setInterval(async () => {
      elapsed += 2;
      if (elapsed >= CONFIRMATION_POLL_SECONDS) {
        setTimedOut(true);
        clearInterval(interval);
        return;
      }
      try {
        const res = await fetch(`/api/orders/${orderNumber}/status?t=${token}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (data.status && data.status !== "pending") {
          setStatus(data.status);
          clearInterval(interval);
        }
      } catch {
        // keep polling; a transient network error shouldn't stop the confirmation flow
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [status, orderNumber, token]);

  if (status === "pending" && !timedOut) {
    return (
      <div className="text-center py-17.5">
        <div className="w-12 h-12 border-2 border-hairline border-t-ink rounded-full mx-auto mb-7 pc-spin" />
        <div className="font-display text-[28px] font-medium mb-2.5">Confirming your payment…</div>
        <div className="text-sm text-muted">
          Don&rsquo;t close this window — this usually takes a few seconds.
        </div>
      </div>
    );
  }

  if (status === "pending" && timedOut) {
    return (
      <div className="text-center py-17.5">
        <div className="font-display text-[28px] font-medium mb-2.5">Still confirming…</div>
        <div className="text-sm text-muted max-w-[46ch] mx-auto">
          Payment is taking longer than usual — you&rsquo;ll get a confirmation email; nothing to
          do.
        </div>
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className="text-center py-17.5">
        <div className="font-display text-[28px] font-medium mb-2.5">
          Payment didn&rsquo;t go through.
        </div>
        <div className="text-sm text-muted max-w-[46ch] mx-auto mb-8">
          Order {orderNumber} wasn&rsquo;t completed — you were not charged. You can try again
          from your cart.
        </div>
        <Link
          href="/cart"
          className="inline-flex h-[50px] px-6.5 items-center bg-ink text-paper rounded-md font-body font-medium text-sm hover:bg-ink-soft"
        >
          Return to cart
        </Link>
      </div>
    );
  }

  const currentStep = STATUS_STEP[status] ?? 0;

  return (
    <div>
      <div className="text-[11px] tracking-[0.3em] uppercase text-accent-green font-semibold mb-4.5">
        Payment received
      </div>
      <h1 className="font-display font-medium text-[clamp(40px,5vw,54px)] m-0 mb-2.5 tracking-[-0.01em]">
        Thank you.
      </h1>
      <p className="font-display italic text-lg text-muted m-0">
        Order {orderNumber} — a receipt is on its way to your inbox.
      </p>

      <div className="my-10 border border-hairline bg-surface rounded-xl overflow-hidden">
        <div className="px-6.5 py-6 border-b border-hairline">
          <div className="text-[11px] tracking-[0.2em] uppercase text-muted font-semibold mb-4">
            Your prints
          </div>
          {items.map((item) => (
            <div key={item.sku} className="flex items-center gap-4 py-2">
              <div className="flex-1">
                <div className="font-display text-lg">{item.title}</div>
                <div className="text-[12.5px] text-muted">
                  {[item.sizeLabel, item.finish ? `${item.finish} frame` : null]
                    .filter(Boolean)
                    .join(" · ")}
                  {item.qty > 1 ? ` · Qty ${item.qty}` : ""}
                </div>
              </div>
              <div className="text-sm whitespace-nowrap">
                {formatPaise(item.unitPricePaise * item.qty)}
              </div>
            </div>
          ))}
          <div className="pt-3 mt-1 border-t border-hairline-soft flex flex-col gap-1.5 text-[13px]">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span>{formatPaise(subtotalPaise)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Shipping</span>
              <span>{shippingPaise === 0 ? "Free" : formatPaise(shippingPaise)}</span>
            </div>
            <div className="flex justify-between font-medium text-sm mt-1">
              <span>Total</span>
              <span>{formatPaise(totalPaise)}</span>
            </div>
          </div>
        </div>

        {address && (
          <div className="px-6.5 py-6 border-b border-hairline">
            <div className="text-[11px] tracking-[0.2em] uppercase text-muted font-semibold mb-3">
              Shipping to
            </div>
            <div className="text-sm text-ink leading-relaxed">
              {address.line1}
              {address.line2 ? `, ${address.line2}` : ""}
              <br />
              {address.city}, {address.state} {address.pincode}
            </div>
            <div className="text-[12.5px] text-muted mt-1.5">{email}</div>
          </div>
        )}

        <div className="p-6.5">
          <div className="text-[11px] tracking-[0.2em] uppercase text-muted font-semibold mb-6">
            Delivery
          </div>
          <div className="flex justify-between relative">
            <div className="absolute left-[8%] right-[8%] top-2 h-px bg-hairline" />
            <div
              className="absolute left-[8%] top-2 h-px bg-accent-green"
              style={{ width: `${Math.max(0, currentStep) * (84 / 3)}%` }}
            />
            {STEPS.map((label, i) => (
              <div key={label} className="relative z-10 text-center flex-1">
                <div
                  className="w-[17px] h-[17px] rounded-full mx-auto"
                  style={{
                    background: i <= currentStep ? "var(--color-accent-green)" : "var(--color-paper)",
                    border: `1px solid ${i <= currentStep ? "var(--color-accent-green)" : "var(--color-border-input)"}`,
                  }}
                />
                <div
                  className="text-[11.5px] font-medium mt-2"
                  style={{ color: i <= currentStep ? "var(--color-ink)" : "var(--color-faint)" }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <Link
          href="/prints"
          className="inline-flex h-[50px] px-6.5 items-center bg-ink text-paper rounded-md font-body font-medium text-sm hover:bg-ink-soft"
        >
          Continue browsing
        </Link>
        <div className="text-[12.5px] text-faint">
          Ordered on {formatOrderDate(createdAt)} · Questions?{" "}
          <span className="text-ink">info@swapnilsharma.in</span>
        </div>
      </div>
    </div>
  );
}
