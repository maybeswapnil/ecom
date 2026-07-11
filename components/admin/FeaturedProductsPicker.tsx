"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setFeaturedProducts } from "@/lib/admin/product-actions";

const FEATURED_MAX = 6;

type PickerProduct = {
  id: string;
  title: string;
  is_featured: boolean;
  featured_order: number | null;
};

export function FeaturedProductsPicker({ products }: { products: PickerProduct[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(() =>
    products
      .filter((p) => p.is_featured)
      .sort((a, b) => (a.featured_order ?? 0) - (b.featured_order ?? 0))
      .map((p) => p.id)
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setError(null);
    setSelected((current) => {
      if (current.includes(id)) return current.filter((existing) => existing !== id);
      if (current.length >= FEATURED_MAX) {
        setError(`You can feature at most ${FEATURED_MAX} products.`);
        return current;
      }
      return [...current, id];
    });
  }

  function move(id: string, direction: -1 | 1) {
    setSelected((current) => {
      const index = current.indexOf(id);
      const swapWith = index + direction;
      if (swapWith < 0 || swapWith >= current.length) return current;
      const next = [...current];
      [next[index], next[swapWith]] = [next[swapWith], next[index]];
      return next;
    });
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await setFeaturedProducts(selected);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  const byId = new Map(products.map((p) => [p.id, p]));

  return (
    <div className="border border-hairline rounded-xl bg-surface p-5 flex flex-col gap-4">
      <div>
        <div className="text-sm font-semibold mb-1">Featured on home page</div>
        <div className="text-xs text-muted">
          Choose 1 to {FEATURED_MAX} live products to show in &ldquo;From the collection&rdquo;. Order
          below sets their display order.
        </div>
      </div>

      {selected.length > 0 && (
        <ol className="flex flex-col gap-1.5">
          {selected.map((id, index) => {
            const product = byId.get(id);
            if (!product) return null;
            return (
              <li
                key={id}
                className="flex items-center gap-3 border border-hairline-soft rounded-lg px-3 py-2"
              >
                <span className="text-xs text-faint w-4">{index + 1}</span>
                <span className="flex-1 text-sm font-medium">{product.title}</span>
                <button
                  type="button"
                  onClick={() => move(id, -1)}
                  disabled={index === 0}
                  className="h-7 w-7 bg-transparent border border-border-input rounded text-xs disabled:opacity-30"
                  aria-label={`Move ${product.title} earlier`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(id, 1)}
                  disabled={index === selected.length - 1}
                  className="h-7 w-7 bg-transparent border border-border-input rounded text-xs disabled:opacity-30"
                  aria-label={`Move ${product.title} later`}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  className="h-7 px-2 bg-transparent border border-border-input rounded text-xs"
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ol>
      )}

      <div className="flex flex-wrap gap-2">
        {products
          .filter((p) => !selected.includes(p.id))
          .map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              disabled={selected.length >= FEATURED_MAX}
              className="h-8 px-3 bg-transparent border border-border-input rounded-full text-xs disabled:opacity-30"
            >
              + {p.title}
            </button>
          ))}
        {products.length === 0 && (
          <div className="text-xs text-faint italic">No live products yet.</div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="h-9 px-4 bg-ink text-paper rounded-md text-sm font-medium disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save featured selection"}
        </button>
        {error && <span className="text-xs text-red-700">{error}</span>}
      </div>
    </div>
  );
}
