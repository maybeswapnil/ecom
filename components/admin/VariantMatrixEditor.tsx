"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertVariant } from "@/lib/admin/product-actions";
import { formatPaise } from "@/lib/money";
import type { ProductVariant } from "@/lib/types";

const SIZES = ["A4", "A3", "A2", "A1", "30x40", "40x50", "50x70"];
const FINISHES = ["Black", "White", "Oak", "Walnut", "Beige"];

function suggestSku(slug: string, size: string, finish: string): string {
  return `PC-${slug.toUpperCase()}-${size.toUpperCase()}-${finish.slice(0, 3).toUpperCase()}`;
}

export function VariantMatrixEditor({
  productId,
  variants,
  productSlug,
  variantHasOrders,
}: {
  productId: string;
  variants: ProductVariant[];
  productSlug: string;
  variantHasOrders: Record<string, boolean>;
}) {
  const router = useRouter();
  const variantByKey = new Map(variants.map((v) => [`${v.size_label}|${v.frame_finish}`, v]));
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [form, setForm] = useState({ price: "", stock: "", active: true });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function startEdit(size: string, finish: string) {
    const key = `${size}|${finish}`;
    const existing = variantByKey.get(key);
    setForm({
      price: existing ? String(existing.price_paise / 100) : "",
      stock: existing ? String(existing.stock_qty) : "0",
      active: existing ? existing.active : true,
    });
    setEditingKey(key);
    setError(null);
  }

  async function handleSave(size: string, finish: string) {
    setError(null);
    const priceRupees = parseFloat(form.price);
    const stock = parseInt(form.stock, 10);
    if (isNaN(priceRupees) || priceRupees <= 0) {
      setError("Enter a valid price.");
      return;
    }
    if (isNaN(stock) || stock < 0) {
      setError("Enter a valid stock quantity.");
      return;
    }

    setSubmitting(true);
    const existing = variantByKey.get(`${size}|${finish}`);
    const result = await upsertVariant(productId, {
      id: existing?.id,
      sku: existing?.sku ?? suggestSku(productSlug, size, finish),
      sizeLabel: size,
      frameFinish: finish,
      pricePaise: Math.round(priceRupees * 100),
      stockQty: stock,
      weightG: existing?.weight_g ?? undefined,
      widthMm: existing?.width_mm ?? undefined,
      heightMm: existing?.height_mm ?? undefined,
      depthMm: existing?.depth_mm ?? undefined,
      active: form.active,
    });
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setEditingKey(null);
    router.refresh();
  }

  return (
    <div className="border border-hairline bg-surface rounded-xl p-5">
      <div className="text-sm font-semibold mb-1">Variants</div>
      <div className="text-xs text-muted mb-4">
        Size × frame finish. SKU is auto-suggested and becomes immutable once an order references
        it.
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left text-[11px] uppercase tracking-[0.08em] text-faint pb-2">
                Size
              </th>
              {FINISHES.map((f) => (
                <th key={f} className="text-left text-[11px] uppercase tracking-[0.08em] text-faint pb-2 pl-4">
                  {f}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SIZES.map((size) => (
              <tr key={size} className="border-t border-hairline-soft">
                <td className="py-2.5 font-medium">{size}</td>
                {FINISHES.map((finish) => {
                  const key = `${size}|${finish}`;
                  const existing = variantByKey.get(key);
                  const isEditing = editingKey === key;

                  if (isEditing) {
                    return (
                      <td key={finish} className="py-2.5 pl-4 align-top">
                        <div className="flex flex-col gap-1.5 w-36">
                          <input
                            type="number"
                            placeholder="Price ₹"
                            value={form.price}
                            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                            className="h-8 px-2 text-xs border border-border-input rounded"
                          />
                          <input
                            type="number"
                            placeholder="Stock"
                            value={form.stock}
                            onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                            className="h-8 px-2 text-xs border border-border-input rounded"
                          />
                          <label className="flex items-center gap-1.5 text-xs">
                            <input
                              type="checkbox"
                              checked={form.active}
                              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                            />
                            Active
                          </label>
                          {existing && variantHasOrders[existing.id] && (
                            <div className="text-[10px] text-faint">SKU locked (has orders)</div>
                          )}
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleSave(size, finish)}
                              disabled={submitting}
                              className="h-7 px-2 bg-ink text-paper rounded text-xs"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingKey(null)}
                              className="h-7 px-2 bg-transparent border border-border-input rounded text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                          {error && <div className="text-[10px] text-red-700">{error}</div>}
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td key={finish} className="py-2.5 pl-4 align-top">
                      <button
                        onClick={() => startEdit(size, finish)}
                        className="text-left bg-transparent border-none cursor-pointer w-full"
                      >
                        {existing ? (
                          <div>
                            <div className={existing.active ? "" : "opacity-40 line-through"}>
                              {formatPaise(existing.price_paise)}
                            </div>
                            <div className="text-xs text-muted">Stock: {existing.stock_qty}</div>
                          </div>
                        ) : (
                          <div className="text-xs text-faint italic">+ Add</div>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
