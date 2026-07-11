import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { NewProductForm } from "@/components/admin/NewProductForm";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { FeaturedProductsPicker } from "@/components/admin/FeaturedProductsPicker";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-surface-sunken text-muted",
  live: "bg-green-100 text-green-800",
  archived: "bg-hairline text-muted",
};

export default async function AdminProductsPage() {
  const supabase = createAdminClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, slug, title, status, is_featured, featured_order, product_variants(id, stock_qty)")
    .order("created_at", { ascending: false });

  const liveProducts = (products ?? []).filter((p) => p.status === "live");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-medium">Products</h1>
        <NewProductForm />
      </div>

      <FeaturedProductsPicker products={liveProducts} />

      <div className="border border-hairline rounded-xl overflow-hidden bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-[11px] uppercase tracking-[0.08em] text-faint">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Variants</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => {
              const variants = p.product_variants ?? [];
              const stockSum = variants.reduce((sum, v) => sum + v.stock_qty, 0);
              return (
                <tr key={p.id} className="border-b border-hairline-soft last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="font-medium hover:underline">
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${STATUS_STYLES[p.status] ?? ""}`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{variants.length}</td>
                  <td className="px-4 py-3 text-muted">{stockSum}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {p.status === "live" && (
                        <a
                          href={`/prints/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted hover:text-ink underline"
                        >
                          View live
                        </a>
                      )}
                      <DeleteProductButton productId={p.id} title={p.title} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {(products ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
