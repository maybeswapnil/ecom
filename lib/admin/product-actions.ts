"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProductImage } from "@/lib/types";

export async function createProduct(input: {
  slug: string;
  title: string;
  description?: string;
  story?: string;
  tags: string[];
}) {
  await requireAdmin();
  const supabase = createAdminClient();

  if (!/^[a-z0-9-]+$/.test(input.slug)) {
    return { error: "Slug must be lowercase letters, numbers, and hyphens only." };
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      slug: input.slug,
      title: input.title,
      description: input.description ?? null,
      story: input.story ?? null,
      tags: input.tags,
      images: [],
      status: "draft",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/admin/products");
  return { ok: true, id: data.id };
}

export async function updateProduct(
  productId: string,
  input: { title: string; description?: string; story?: string; tags: string[] }
) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: product } = await supabase
    .from("products")
    .select("slug")
    .eq("id", productId)
    .maybeSingle();
  if (!product) return { error: "Product not found." };

  const { error } = await supabase
    .from("products")
    .update({
      title: input.title,
      description: input.description ?? null,
      story: input.story ?? null,
      tags: input.tags,
    })
    .eq("id", productId);

  if (error) return { error: error.message };
  revalidatePath(`/admin/products/${productId}`);
  updateTag(`product:${product.slug}`);
  updateTag("shop-grid");
  return { ok: true };
}

export async function deleteProduct(productId: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: product } = await supabase
    .from("products")
    .select("slug, product_variants(id)")
    .eq("id", productId)
    .maybeSingle();
  if (!product) return { error: "Product not found." };

  const variantIds = (product.product_variants ?? []).map((v) => v.id);
  if (variantIds.length > 0) {
    const { count } = await supabase
      .from("order_items")
      .select("id", { count: "exact", head: true })
      .in("variant_id", variantIds);
    if (count && count > 0) {
      return {
        error:
          "This product has order history and can't be deleted. Archive it instead to remove it from the storefront.",
      };
    }
  }

  const { error: variantError } = await supabase
    .from("product_variants")
    .delete()
    .eq("product_id", productId);
  if (variantError) return { error: variantError.message };

  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) return { error: error.message };

  revalidatePath("/admin/products");
  updateTag(`product:${product.slug}`);
  updateTag("shop-grid");
  return { ok: true };
}

const FEATURED_MAX = 6;

export async function setFeaturedProducts(productIds: string[]) {
  await requireAdmin();
  const supabase = createAdminClient();

  const uniqueIds = [...new Set(productIds)];
  if (uniqueIds.length > FEATURED_MAX) {
    return { error: `Choose at most ${FEATURED_MAX} featured products.` };
  }

  const { error: clearError } = await supabase
    .from("products")
    .update({ is_featured: false, featured_order: null })
    .eq("is_featured", true);
  if (clearError) return { error: clearError.message };

  for (const [index, productId] of uniqueIds.entries()) {
    const { error } = await supabase
      .from("products")
      .update({ is_featured: true, featured_order: index + 1 })
      .eq("id", productId);
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  updateTag("shop-grid");
  return { ok: true };
}

export async function setProductStatus(productId: string, status: "draft" | "live" | "archived") {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: product } = await supabase
    .from("products")
    .select("slug")
    .eq("id", productId)
    .maybeSingle();
  if (!product) return { error: "Product not found." };

  const { error } = await supabase.from("products").update({ status }).eq("id", productId);
  if (error) return { error: error.message };

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/products");
  updateTag(`product:${product.slug}`);
  updateTag("shop-grid");
  return { ok: true };
}

export async function updateProductImages(productId: string, images: ProductImage[]) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: product } = await supabase
    .from("products")
    .select("slug")
    .eq("id", productId)
    .maybeSingle();
  if (!product) return { error: "Product not found." };

  const { error } = await supabase.from("products").update({ images }).eq("id", productId);
  if (error) return { error: error.message };

  revalidatePath(`/admin/products/${productId}`);
  updateTag(`product:${product.slug}`);
  return { ok: true };
}

export async function uploadProductImage(productId: string, formData: FormData) {
  await requireAdmin();
  const supabase = createAdminClient();

  const file = formData.get("file") as File | null;
  if (!file) return { error: "No file provided." };
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return { error: "Only JPG, PNG, or WebP images are allowed." };
  }
  if (file.size > 4 * 1024 * 1024) {
    return { error: "Image must be 4MB or smaller." };
  }

  const ext = file.name.split(".").pop();
  const path = `${productId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("product-images").getPublicUrl(path);

  return { ok: true, url: publicUrl };
}

export async function upsertVariant(
  productId: string,
  input: {
    id?: string;
    sku: string;
    sizeLabel: string;
    frameFinish: string;
    pricePaise: number;
    compareAtPaise?: number;
    stockQty: number;
    weightG?: number;
    widthMm?: number;
    heightMm?: number;
    depthMm?: number;
    active: boolean;
  }
) {
  await requireAdmin();
  const supabase = createAdminClient();

  if (input.id) {
    // SKU is immutable once any order references it — enforce by checking order_items first.
    const { data: referenced } = await supabase
      .from("order_items")
      .select("id")
      .eq("variant_id", input.id)
      .limit(1);

    const updatePayload: Record<string, unknown> = {
      size_label: input.sizeLabel,
      frame_finish: input.frameFinish,
      price_paise: input.pricePaise,
      compare_at_paise: input.compareAtPaise ?? null,
      stock_qty: input.stockQty,
      weight_g: input.weightG ?? null,
      width_mm: input.widthMm ?? null,
      height_mm: input.heightMm ?? null,
      depth_mm: input.depthMm ?? null,
      active: input.active,
    };
    if (!referenced || referenced.length === 0) {
      updatePayload.sku = input.sku;
    }

    const { error } = await supabase
      .from("product_variants")
      .update(updatePayload)
      .eq("id", input.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("product_variants").insert({
      product_id: productId,
      sku: input.sku,
      size_label: input.sizeLabel,
      frame_finish: input.frameFinish,
      price_paise: input.pricePaise,
      compare_at_paise: input.compareAtPaise ?? null,
      stock_qty: input.stockQty,
      weight_g: input.weightG ?? null,
      width_mm: input.widthMm ?? null,
      height_mm: input.heightMm ?? null,
      depth_mm: input.depthMm ?? null,
      active: input.active,
    });
    if (error) return { error: error.message };
  }

  const { data: product } = await supabase
    .from("products")
    .select("slug")
    .eq("id", productId)
    .maybeSingle();
  if (product) updateTag(`product:${product.slug}`);
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true };
}
