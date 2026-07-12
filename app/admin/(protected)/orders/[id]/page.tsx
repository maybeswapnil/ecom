import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPaise } from "@/lib/money";
import { OrderActionsPanel } from "@/components/admin/OrderActionsPanel";
import { CopyButton } from "@/components/admin/CopyButton";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: order } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (!order) notFound();

  const [{ data: items }, { data: history }, { data: shipment }, { data: refunds }] =
    await Promise.all([
      supabase.from("order_items").select("*").eq("order_id", id),
      supabase
        .from("order_status_history")
        .select("*")
        .eq("order_id", id)
        .order("created_at", { ascending: true }),
      supabase.from("shipments").select("*").eq("order_id", id).eq("active", true).maybeSingle(),
      supabase.from("refunds").select("*").eq("order_id", id),
    ]);

  // Free-shipping refund-abuse guardrail: this order qualified for free shipping, but refunds
  // have pulled it back below the threshold it qualified with.
  let appliedOfferThresholdPaise: number | null = null;
  if (order.applied_offer_id) {
    const { data: appliedOffer } = await supabase
      .from("offers")
      .select("min_subtotal_paise")
      .eq("id", order.applied_offer_id)
      .maybeSingle();
    appliedOfferThresholdPaise = appliedOffer?.min_subtotal_paise ?? null;
  }
  const refundedPaise = (refunds ?? []).reduce((sum, r) => sum + r.amount_paise, 0);
  const freeShipBelowThreshold =
    appliedOfferThresholdPaise !== null &&
    refundedPaise > 0 &&
    order.subtotal_paise - refundedPaise < appliedOfferThresholdPaise;

  const address = order.shipping_address as {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };

  const courierText = [order.email, order.phone, "", address.line1, address.line2, `${address.city}, ${address.state} ${address.pincode}`]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-medium">{order.order_number}</h1>
        <span className="px-3 py-1.5 rounded-md bg-surface-sunken text-sm font-medium">
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="border border-hairline bg-surface rounded-xl p-5">
            <div className="text-sm font-semibold mb-3">Items</div>
            <div className="flex flex-col gap-2">
              {(items ?? []).map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.title_snapshot} ({item.sku_snapshot}) × {item.qty}
                  </span>
                  <span>{formatPaise(item.unit_price_paise * item.qty)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-hairline mt-3 pt-3 flex flex-col gap-1 text-sm">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span>{formatPaise(order.subtotal_paise)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Shipping</span>
                <span>{formatPaise(order.shipping_paise)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPaise(order.total_paise)}</span>
              </div>
            </div>
          </div>

          <div className="border border-hairline bg-surface rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">Address</div>
              <CopyButton text={courierText} />
            </div>
            <div className="text-sm text-ink whitespace-pre-line">{courierText}</div>
          </div>

          <div className="border border-hairline bg-surface rounded-xl p-5">
            <div className="text-sm font-semibold mb-3">Payment</div>
            <div className="text-sm text-muted flex flex-col gap-1">
              <div>Razorpay order: {order.razorpay_order_id ?? "—"}</div>
              <div>
                Razorpay payment:{" "}
                {order.razorpay_payment_id ? (
                  <a
                    href={`https://dashboard.razorpay.com/app/payments/${order.razorpay_payment_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {order.razorpay_payment_id}
                  </a>
                ) : (
                  "—"
                )}
              </div>
              {(refunds ?? []).map((r) => (
                <div key={r.id}>
                  Refund {formatPaise(r.amount_paise)} on{" "}
                  {new Date(r.created_at).toLocaleDateString("en-IN")}
                  {r.restocked ? " (restocked)" : ""}
                </div>
              ))}
              {freeShipBelowThreshold && (
                <div className="mt-2 px-3 py-2 rounded-md bg-amber-50 border border-amber-300 text-amber-900 text-[12.5px]">
                  This order shipped free (threshold {formatPaise(appliedOfferThresholdPaise!)}),
                  but refunds have brought it below that threshold. Consider deducting the shipping
                  fee from any further refund.
                </div>
              )}
            </div>
          </div>

          {shipment && (
            <div className="border border-hairline bg-surface rounded-xl p-5">
              <div className="text-sm font-semibold mb-3">Shipment</div>
              <div className="text-sm text-muted flex flex-col gap-1">
                <div>Courier: {shipment.courier_name ?? "—"}</div>
                <div>AWB: {shipment.awb ?? "—"}</div>
                <div>Status: {shipment.status}</div>
                {shipment.label_url && (
                  <a href={shipment.label_url} target="_blank" rel="noopener noreferrer" className="underline">
                    Download label
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="border border-hairline bg-surface rounded-xl p-5">
            <div className="text-sm font-semibold mb-3">Timeline</div>
            <div className="flex flex-col gap-2 text-sm">
              {(history ?? []).map((h) => (
                <div key={h.id} className="flex justify-between text-muted">
                  <span>
                    {h.from_status} → {h.to_status} ({h.actor})
                  </span>
                  <span>{new Date(h.created_at).toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
          </div>

          {order.internal_notes && (
            <div className="border border-hairline bg-surface rounded-xl p-5">
              <div className="text-sm font-semibold mb-3">Internal notes</div>
              <pre className="text-sm text-muted whitespace-pre-wrap font-body">
                {order.internal_notes}
              </pre>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <OrderActionsPanel orderId={order.id} status={order.status} />

          <div className="border border-hairline bg-surface rounded-xl p-5">
            <div className="text-sm font-semibold mb-3">Attribution</div>
            <div className="text-xs text-muted flex flex-col gap-1">
              {Object.entries((order.attribution as Record<string, unknown>) ?? {}).map(
                ([key, value]) =>
                  value ? (
                    <div key={key}>
                      {key}: {String(value)}
                    </div>
                  ) : null
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
