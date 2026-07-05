import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidReceiptToken } from "@/lib/order-token";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  const { number } = await params;
  const url = new URL(req.url);
  const token = url.searchParams.get("t");

  if (!token || !isValidReceiptToken(number, token)) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Invalid or missing token" } },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  const supabase = createAdminClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, status, paid_at")
    .eq("order_number", number)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Order not found" } },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  const { data: shipment } = await supabase
    .from("shipments")
    .select("courier_name, awb, status, tracking_events")
    .eq("order_id", order.id)
    .eq("active", true)
    .maybeSingle();

  const lastEvent = shipment?.tracking_events?.length
    ? shipment.tracking_events[shipment.tracking_events.length - 1]
    : null;

  return NextResponse.json(
    {
      status: order.status,
      paid_at: order.paid_at,
      shipment: shipment
        ? {
            courier: shipment.courier_name,
            awb: shipment.awb,
            tracking_url: null,
            last_event: lastEvent?.description ?? null,
            last_event_at: lastEvent?.at ?? null,
          }
        : null,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
