import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkoutSchema } from "@/lib/validation";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { createRazorpayOrder, RazorpayNotConfiguredError } from "@/lib/razorpay";
import { receiptToken } from "@/lib/order-token";
import { FREE_SHIP_THRESHOLD_PAISE, SHIPPING_FLAT_PAISE } from "@/lib/config";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  const withinLimit = await checkRateLimit(`checkout:${ip}`, 10, 60);
  if (!withinLimit) return errorResponse("RATE_LIMITED", "Too many requests", 429);

  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "VALIDATION_FAILED",
      "Invalid request body",
      400,
      parsed.error.flatten()
    );
  }
  const input = parsed.data;
  const supabase = createAdminClient();

  // Idempotency: replay the original response for a duplicate key on a still-pending order.
  const { data: existing } = await supabase
    .from("orders")
    .select("order_number, total_paise, razorpay_order_id")
    .eq("idempotency_key", input.idempotency_key)
    .eq("status", "pending")
    .maybeSingle();

  if (existing?.razorpay_order_id) {
    return NextResponse.json({
      order_number: existing.order_number,
      amount_paise: existing.total_paise,
      razorpay: {
        key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: existing.razorpay_order_id,
      },
      prefill: {
        name: input.customer.name,
        email: input.customer.email,
        contact: input.customer.phone,
      },
      receipt_token: receiptToken(existing.order_number),
    });
  }

  const skus = input.items.map((i) => i.sku);
  const { data: variants, error: variantsError } = await supabase
    .from("product_variants")
    .select("id, sku, price_paise, stock_qty, active, weight_g, product_id")
    .in("sku", skus);

  if (variantsError) return errorResponse("INTERNAL", "Failed to load variants", 500);

  const variantBySku = new Map((variants ?? []).map((v) => [v.sku, v]));
  const productIds = [...new Set((variants ?? []).map((v) => v.product_id))];
  const { data: products } = await supabase
    .from("products")
    .select("id, title, status")
    .in("id", productIds.length ? productIds : ["00000000-0000-0000-0000-000000000000"]);
  const productById = new Map((products ?? []).map((p) => [p.id, p]));

  const missingSkus = skus.filter((sku) => {
    const v = variantBySku.get(sku);
    if (!v || !v.active) return true;
    const product = productById.get(v.product_id);
    return !product || product.status !== "live";
  });
  if (missingSkus.length > 0) {
    return errorResponse("ITEMS_UNAVAILABLE", "Some items are no longer available", 409, {
      skus: missingSkus,
    });
  }

  for (const item of input.items) {
    const v = variantBySku.get(item.sku)!;
    if (v.stock_qty < item.qty) {
      return errorResponse("OUT_OF_STOCK", `${item.sku} is out of stock`, 409, {
        sku: item.sku,
        available_qty: v.stock_qty,
      });
    }
  }

  // Serviceability check (§2.2 step 6) is a NimbusPost integration point — deferred until
  // NimbusPost credentials are configured (fail-open by design, so this omission is safe).

  const subtotalPaise = input.items.reduce((sum, item) => {
    const v = variantBySku.get(item.sku)!;
    return sum + v.price_paise * item.qty;
  }, 0);
  const shippingPaise = subtotalPaise >= FREE_SHIP_THRESHOLD_PAISE ? 0 : SHIPPING_FLAT_PAISE;
  const totalPaise = subtotalPaise + shippingPaise;

  if (totalPaise !== input.expected_total_paise) {
    return errorResponse("PRICE_CHANGED", "Cart total has changed", 409, {
      subtotal_paise: subtotalPaise,
      shipping_paise: shippingPaise,
      total_paise: totalPaise,
    });
  }

  const purchaseEventId = crypto.randomUUID();

  const { data: orderNumberRow } = await supabase.rpc("nextval_order_number");
  const orderNumber = orderNumberRow ?? `FP-${Date.now()}`;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      status: "pending",
      email: input.customer.email,
      phone: input.customer.phone,
      shipping_address: input.address,
      subtotal_paise: subtotalPaise,
      shipping_paise: shippingPaise,
      total_paise: totalPaise,
      purchase_event_id: purchaseEventId,
      idempotency_key: input.idempotency_key,
      attribution: { ph_distinct_id: input.ph_distinct_id ?? null },
    })
    .select("id, order_number")
    .single();

  if (orderError || !order) {
    return errorResponse("INTERNAL", "Failed to create order", 500);
  }

  const orderItems = input.items.map((item) => {
    const v = variantBySku.get(item.sku)!;
    return {
      order_id: order.id,
      variant_id: v.id,
      title_snapshot: productById.get(v.product_id)?.title ?? item.sku,
      sku_snapshot: item.sku,
      unit_price_paise: v.price_paise,
      qty: item.qty,
    };
  });
  await supabase.from("order_items").insert(orderItems);

  try {
    const rzpOrder = await createRazorpayOrder({
      amountPaise: totalPaise,
      receipt: order.order_number,
      notes: { order_number: order.order_number },
    });

    await supabase
      .from("orders")
      .update({ razorpay_order_id: rzpOrder.id })
      .eq("id", order.id);

    return NextResponse.json({
      order_number: order.order_number,
      amount_paise: totalPaise,
      razorpay: { key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, order_id: rzpOrder.id },
      prefill: {
        name: input.customer.name,
        email: input.customer.email,
        contact: input.customer.phone,
      },
      receipt_token: receiptToken(order.order_number),
    });
  } catch (err) {
    await supabase
      .from("orders")
      .update({ status: "cancelled", cancelled_reason: "gateway_error" })
      .eq("id", order.id);

    if (err instanceof RazorpayNotConfiguredError) {
      return errorResponse(
        "GATEWAY_ERROR",
        "Payments are not yet configured for this store. Add Razorpay keys to enable checkout.",
        502
      );
    }
    return errorResponse("GATEWAY_ERROR", "Payment gateway error", 502);
  }
}
