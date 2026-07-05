import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProductEditorForm } from "@/components/admin/ProductEditorForm";
import { ProductImageManager } from "@/components/admin/ProductImageManager";
import { VariantMatrixEditor } from "@/components/admin/VariantMatrixEditor";
import { ProductStatusControl } from "@/components/admin/ProductStatusControl";
import type { ProductVariant } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminProductEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: product } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .eq("id", id)
    .maybeSingle();
  if (!product) notFound();

  const hasOrders = await Promise.all(
    (product.product_variants as ProductVariant[]).map(async (v) => {
      const { data } = await supabase
        .from("order_items")
        .select("id")
        .eq("variant_id", v.id)
        .limit(1);
      return [v.id, (data ?? []).length > 0] as const;
    })
  );
  const variantHasOrders = Object.fromEntries(hasOrders);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-medium">{product.title}</h1>
        <ProductStatusControl productId={product.id} status={product.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <ProductEditorForm product={product} />
          <VariantMatrixEditor
            productId={product.id}
            variants={product.product_variants}
            productSlug={product.slug}
            variantHasOrders={variantHasOrders}
          />
        </div>
        <div>
          <ProductImageManager productId={product.id} images={product.images} />
        </div>
      </div>
    </div>
  );
}
