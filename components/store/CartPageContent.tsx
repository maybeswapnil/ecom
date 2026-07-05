"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, startTransition } from "react";
import { useCartStore, cartSubtotalPaise } from "@/lib/cart-store";
import { useHydrated } from "@/lib/use-hydrated";
import { formatPaise } from "@/lib/money";
import { FREE_SHIP_THRESHOLD_PAISE } from "@/lib/config";

export function CartPageContent() {
  const lines = useCartStore((s) => s.lines);
  const removeLine = useCartStore((s) => s.removeLine);
  const incQty = useCartStore((s) => s.incQty);
  const applyValidation = useCartStore((s) => s.applyValidation);
  const hydrated = useHydrated();
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (!hydrated || lines.length === 0) return;
    let cancelled = false;

    startTransition(() => setValidating(true));
    fetch("/api/cart/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: lines.map((l) => ({ sku: l.sku, qty: l.qty })) }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.items) applyValidation(data.items);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setValidating(false);
      });

    return () => {
      cancelled = true;
    };
    // Re-validate only when the set of lines changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, lines.length]);

  if (!hydrated) return null;

  if (lines.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="font-display italic text-xl text-muted mb-6">
          Your cart is empty — add a print to continue.
        </div>
        <Link
          href="/prints"
          className="inline-flex h-12 px-6 items-center bg-ink text-paper rounded-md font-body font-medium text-sm"
        >
          Browse prints
        </Link>
      </div>
    );
  }

  const subtotal = cartSubtotalPaise(lines);
  const hasBlockingLine = lines.some((l) => l.state === "out_of_stock" || l.state === "unavailable");
  const remaining = Math.max(0, FREE_SHIP_THRESHOLD_PAISE - subtotal);
  const freeReached = subtotal >= FREE_SHIP_THRESHOLD_PAISE;

  return (
    <div>
      <div className="mb-8">
        <div className="text-[12.5px] text-muted-soft mb-2.5">
          {freeReached
            ? "Free insured shipping unlocked."
            : `Add ${formatPaise(remaining)} more for free shipping.`}
        </div>
        <div className="h-[3px] bg-hairline rounded-full overflow-hidden">
          <div
            className="h-full bg-ink transition-[width] duration-300 ease-out"
            style={{ width: `${Math.min(100, (subtotal / FREE_SHIP_THRESHOLD_PAISE) * 100)}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-0">
        {lines.map((l) => (
          <div key={l.sku} className="flex gap-4 py-6 border-b border-hairline-soft">
            <div className="w-20 flex-none bg-surface border border-hairline p-1 self-start">
              <div className="relative w-full aspect-square">
                <Image src={l.snapshot.image} alt="" fill className="object-cover" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between gap-2.5 items-baseline">
                <div className="flex-1 min-w-0 font-display text-lg font-medium">
                  {l.snapshot.title}
                </div>
                <button
                  onClick={() => removeLine(l.sku)}
                  className="flex-none bg-transparent border-none text-faint cursor-pointer text-xs p-0 hover:text-ink"
                >
                  Remove
                </button>
              </div>
              <div className="text-[12.5px] text-muted mt-1">
                {l.snapshot.sizeLabel} · {l.snapshot.finish} frame
              </div>
              {l.state === "price_changed" && (
                <div className="text-[12px] text-accent-green mt-1">Price updated</div>
              )}
              {l.state === "out_of_stock" && (
                <div className="text-[12px] text-red-700 mt-1">
                  Only {l.availableQty ?? 0} left in stock
                </div>
              )}
              {l.state === "unavailable" && (
                <div className="text-[12px] text-red-700 mt-1">No longer available — please remove</div>
              )}
              <div className="flex justify-between items-center mt-3">
                <div className="flex items-center border border-border-input rounded-md">
                  <button
                    onClick={() => incQty(l.sku, -1)}
                    className="w-9 h-9 bg-transparent border-none cursor-pointer text-base text-ink"
                  >
                    –
                  </button>
                  <span className="w-7 text-center text-sm">{l.qty}</span>
                  <button
                    onClick={() => incQty(l.sku, 1)}
                    className="w-9 h-9 bg-transparent border-none cursor-pointer text-base text-ink"
                  >
                    +
                  </button>
                </div>
                <div className="text-[15px]">{formatPaise(l.snapshot.pricePaise * l.qty)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 border-t border-hairline pt-6">
        <div className="flex justify-between items-baseline mb-5">
          <span className="text-sm text-muted">Subtotal</span>
          <span className="font-display text-3xl font-medium">{formatPaise(subtotal)}</span>
        </div>
        {hasBlockingLine ? (
          <div className="text-center text-sm text-red-700 py-3">
            Remove unavailable items to continue.
          </div>
        ) : (
          <Link
            href="/checkout"
            className="flex items-center justify-center w-full h-14 bg-ink text-paper rounded-md font-body font-medium text-[15px] hover:bg-ink-soft"
          >
            Checkout
          </Link>
        )}
        {validating && <div className="text-center text-xs text-faint mt-3">Checking prices &amp; stock…</div>}
      </div>
    </div>
  );
}
