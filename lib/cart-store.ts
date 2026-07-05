import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MAX_CART_LINES, MAX_QTY_PER_LINE } from "@/lib/config";

export type CartLineState = "ok" | "price_changed" | "out_of_stock" | "unavailable";

export type CartLine = {
  sku: string;
  qty: number;
  snapshot: {
    title: string;
    sizeLabel: string;
    finish: string;
    pricePaise: number;
    image: string;
    slug: string;
  };
  state?: CartLineState;
  availableQty?: number;
};

type CartStore = {
  lines: CartLine[];
  updatedAt: string;
  addLine: (sku: string, snapshot: CartLine["snapshot"], qty?: number) => void;
  removeLine: (sku: string) => void;
  setQty: (sku: string, qty: number) => void;
  incQty: (sku: string, delta: number) => void;
  clear: () => void;
  applyValidation: (
    results: { sku: string; state: CartLineState; available_qty?: number; price_paise?: number }[]
  ) => void;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      lines: [],
      updatedAt: new Date(0).toISOString(),

      addLine: (sku, snapshot, qty = 1) => {
        const lines = get().lines.slice();
        const existing = lines.find((l) => l.sku === sku);
        if (existing) {
          existing.qty = Math.min(MAX_QTY_PER_LINE, existing.qty + qty);
        } else {
          if (lines.length >= MAX_CART_LINES) return;
          lines.push({ sku, qty: Math.min(MAX_QTY_PER_LINE, qty), snapshot });
        }
        set({ lines, updatedAt: new Date().toISOString() });
      },

      removeLine: (sku) => {
        set({
          lines: get().lines.filter((l) => l.sku !== sku),
          updatedAt: new Date().toISOString(),
        });
      },

      setQty: (sku, qty) => {
        const lines = get()
          .lines.map((l) =>
            l.sku === sku ? { ...l, qty: Math.max(0, Math.min(MAX_QTY_PER_LINE, qty)) } : l
          )
          .filter((l) => l.qty > 0);
        set({ lines, updatedAt: new Date().toISOString() });
      },

      incQty: (sku, delta) => {
        const line = get().lines.find((l) => l.sku === sku);
        if (!line) return;
        get().setQty(sku, line.qty + delta);
      },

      clear: () => set({ lines: [], updatedAt: new Date().toISOString() }),

      applyValidation: (results) => {
        const lines = get().lines.map((l) => {
          const r = results.find((x) => x.sku === l.sku);
          if (!r) return l;
          return {
            ...l,
            state: r.state,
            availableQty: r.available_qty,
            snapshot:
              r.state === "price_changed" && r.price_paise != null
                ? { ...l.snapshot, pricePaise: r.price_paise }
                : l.snapshot,
          };
        });
        set({ lines });
      },
    }),
    {
      name: "fp.cart.v1",
    }
  )
);

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.qty, 0);
}

export function cartSubtotalPaise(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.snapshot.pricePaise * l.qty, 0);
}
