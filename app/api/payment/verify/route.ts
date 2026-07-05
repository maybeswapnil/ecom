import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { paymentVerifySchema } from "@/lib/validation";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { verifyPaymentSignature } from "@/lib/razorpay";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const withinLimit = await checkRateLimit(`payment_verify:${ip}`, 30, 60);
  if (!withinLimit) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = paymentVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_FAILED", message: "Invalid request body" } },
      { status: 400 }
    );
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  let valid: boolean;
  try {
    valid = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Payment verification is not configured" } },
      { status: 500 }
    );
  }

  if (!valid) {
    return NextResponse.json(
      { error: { code: "SIGNATURE_INVALID", message: "Invalid payment signature" } },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data: order, error } = await supabase
    .from("orders")
    .update({ razorpay_payment_id, client_verified_at: new Date().toISOString() })
    .eq("razorpay_order_id", razorpay_order_id)
    .select("order_number, status")
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Order not found" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, order_number: order.order_number, status: order.status });
}
