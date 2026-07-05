import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cartValidateSchema } from "@/lib/validation";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { FREE_SHIP_THRESHOLD_PAISE, SHIPPING_FLAT_PAISE } from "@/lib/config";

export const runtime = "nodejs";

type LineResult = {
  sku: string;
  state: "ok" | "price_changed" | "out_of_stock" | "unavailable";
  price_paise?: number;
  available_qty?: number;
  title?: string;
  image?: string;
};

export async function POST(req: Request) {
  const ip = clientIp(req);
  const withinLimit = await checkRateLimit(`cart_validate:${ip}`, 60, 60);
  if (!withinLimit) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = cartValidateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid request body",
          details: parsed.error.flatten(),
        },
      },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const skus = parsed.data.items.map((i) => i.sku);

  const { data: variants, error } = await supabase
    .from("product_variants")
    .select("sku, price_paise, stock_qty, active, size_label, frame_finish, product_id")
    .in("sku", skus);

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Failed to load variants" } },
      { status: 500 }
    );
  }

  const productIds = [...new Set((variants ?? []).map((v) => v.product_id))];
  const { data: products } = await supabase
    .from("products")
    .select("id, title, images, status")
    .in("id", productIds.length ? productIds : ["00000000-0000-0000-0000-000000000000"]);

  const productById = new Map((products ?? []).map((p) => [p.id, p]));
  const variantBySku = new Map((variants ?? []).map((v) => [v.sku, v]));

  let subtotalPaise = 0;
  const items: LineResult[] = parsed.data.items.map((item) => {
    const variant = variantBySku.get(item.sku);
    if (!variant) return { sku: item.sku, state: "unavailable" };

    const product = productById.get(variant.product_id);
    if (!variant.active || !product || product.status !== "live") {
      return { sku: item.sku, state: "unavailable" };
    }
    if (variant.stock_qty <= 0 || variant.stock_qty < item.qty) {
      return { sku: item.sku, state: "out_of_stock", available_qty: variant.stock_qty };
    }

    subtotalPaise += variant.price_paise * item.qty;
    return {
      sku: item.sku,
      state: "ok",
      price_paise: variant.price_paise,
      available_qty: variant.stock_qty,
      title: `${product.title} — ${variant.size_label}, ${variant.frame_finish} frame`,
      image: product.images?.[0],
    };
  });

  const shippingPaise = subtotalPaise >= FREE_SHIP_THRESHOLD_PAISE ? 0 : SHIPPING_FLAT_PAISE;
  const freeShipGapPaise = Math.max(0, FREE_SHIP_THRESHOLD_PAISE - subtotalPaise);

  return NextResponse.json({
    items,
    subtotal_paise: subtotalPaise,
    shipping_paise: shippingPaise,
    free_shipping_gap_paise: freeShipGapPaise,
    total_paise: subtotalPaise + shippingPaise,
  });
}
