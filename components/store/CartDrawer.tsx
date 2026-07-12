"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { useCartStore, cartSubtotalPaise } from "@/lib/cart-store";
import { useHydrated } from "@/lib/use-hydrated";
import { formatPaise } from "@/lib/money";
import { useShippingOffer } from "@/lib/use-shipping-offer";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const lines = useCartStore((s) => s.lines);
  const removeLine = useCartStore((s) => s.removeLine);
  const incQty = useCartStore((s) => s.incQty);
  const applyValidation = useCartStore((s) => s.applyValidation);
  const hydrated = useHydrated();
  const shippingOffer = useShippingOffer();

  useEffect(() => {
    if (!open || lines.length === 0) return;
    fetch("/api/cart/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: lines.map((l) => ({ sku: l.sku, qty: l.qty })) }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.items) applyValidation(data.items);
      })
      .catch(() => {});
    // Re-validate on open, not on every keystroke-level line mutation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const subtotal = hydrated ? cartSubtotalPaise(lines) : 0;
  // Hidden while the offer is loading (undefined) or when no free-shipping offer is running (null).
  const threshold = shippingOffer?.thresholdPaise ?? null;
  const remaining = threshold === null ? 0 : Math.max(0, threshold - subtotal);
  const freeReached = threshold !== null && subtotal >= threshold && subtotal > 0;
  const freeShipMsg = freeReached
    ? "Free insured shipping unlocked."
    : subtotal === 0
      ? `Free insured shipping over ${formatPaise(threshold ?? 0)}.`
      : `Add ${formatPaise(remaining)} more for free shipping.`;
  const barWidth = threshold === null ? 0 : Math.min(100, (subtotal / threshold) * 100);

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-ink/35 pc-fade-in"
        style={{ animationDuration: "0.25s" }}
      />
      <div className="absolute top-0 right-0 bottom-0 w-full sm:w-[430px] max-w-full bg-paper flex flex-col shadow-[-30px_0_60px_-34px_rgba(28,25,21,0.35)] pc-fade-in">
        <div className="flex items-center justify-between px-7 py-6.5 border-b border-hairline">
          <span className="font-display text-[26px] font-medium whitespace-nowrap">Cart</span>
          <button
            onClick={onClose}
            className="w-10 h-10 border-none bg-transparent cursor-pointer text-[17px] text-muted hover:text-ink"
          >
            ✕
          </button>
        </div>

        {threshold !== null && (
          <div className="px-7 py-4.5 border-b border-hairline">
            <div className="text-[12.5px] text-muted-soft mb-2.5">{freeShipMsg}</div>
            <div className="h-[3px] bg-hairline rounded-full overflow-hidden">
              <div
                className="h-full bg-ink transition-[width] duration-300 ease-out"
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-7 py-1.5">
          {hydrated && lines.length === 0 && (
            <div className="text-center py-[70px] px-5">
              <div className="font-display italic text-xl text-muted mb-5.5">Nothing here yet.</div>
              <Link
                href="/prints"
                onClick={onClose}
                className="inline-flex h-12 px-6 items-center bg-ink text-paper rounded-md font-body font-medium text-sm cursor-pointer"
              >
                Browse prints
              </Link>
            </div>
          )}
          {hydrated &&
            lines.map((l) => (
              <div key={l.sku} className="flex gap-4 py-5.5 border-b border-hairline-soft">
                <div className="w-16 flex-none bg-surface border border-hairline p-1 self-start">
                  <div className="relative w-full aspect-square">
                    <Image src={l.snapshot.image} alt={l.snapshot.title} fill className="object-cover" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2.5 items-baseline">
                    <div className="flex-1 min-w-0 font-display text-lg font-medium whitespace-nowrap overflow-hidden text-ellipsis">
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
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center border border-border-input rounded-md">
                      <button
                        onClick={() => incQty(l.sku, -1)}
                        className="w-8 h-8 bg-transparent border-none cursor-pointer text-[15px] text-ink"
                      >
                        –
                      </button>
                      <span className="w-6 text-center text-[13.5px]">{l.qty}</span>
                      <button
                        onClick={() => incQty(l.sku, 1)}
                        className="w-8 h-8 bg-transparent border-none cursor-pointer text-[15px] text-ink"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-[14.5px]">{formatPaise(l.snapshot.pricePaise * l.qty)}</div>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {hydrated && lines.length > 0 && (
          <div className="border-t border-hairline px-7 py-5.5">
            <div className="flex justify-between items-baseline mb-4">
              <span className="text-[13px] text-muted">
                Subtotal · {lines.reduce((a, l) => a + l.qty, 0)} item(s)
              </span>
              <span className="font-display text-2xl font-medium">{formatPaise(subtotal)}</span>
            </div>
            <Link
              href="/checkout"
              onClick={onClose}
              className="flex items-center justify-center w-full h-[54px] bg-ink text-paper rounded-md font-body font-medium text-[15px] cursor-pointer hover:bg-ink-soft"
            >
              Checkout
            </Link>
            <div className="text-[11.5px] text-faint text-center mt-3">
              Guest checkout · no account required
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
