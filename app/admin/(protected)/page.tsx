import Link from "next/link";
import { getDashboardData } from "@/lib/admin/dashboard";
import { formatPaise } from "@/lib/money";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export default async function AdminDashboardPage() {
  const { revenueToday, revenue7d, revenue30d, statusCounts, actionQueue, lowStock, alerts } =
    await getDashboardData();

  const hasAlerts =
    alerts.oversold.length > 0 ||
    alerts.paidAfterCancel.length > 0 ||
    alerts.rtoInProgress.length > 0 ||
    alerts.failedEffectsCount > 0;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-medium mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Revenue today" value={formatPaise(revenueToday)} />
          <StatCard label="Revenue, 7 days" value={formatPaise(revenue7d)} />
          <StatCard label="Revenue, 30 days" value={formatPaise(revenue30d)} />
        </div>
      </div>

      {hasAlerts && (
        <div className="border border-red-300 bg-red-50 rounded-xl p-5">
          <div className="text-sm font-semibold text-red-800 mb-3">Needs attention</div>
          <ul className="flex flex-col gap-2 text-sm text-red-800">
            {alerts.oversold.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="underline">
                  {o.order_number}
                </Link>{" "}
                is oversold — fulfil manually or refund.
              </li>
            ))}
            {alerts.paidAfterCancel.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="underline">
                  {o.order_number}
                </Link>{" "}
                was paid after cancellation — refund manually.
              </li>
            ))}
            {alerts.rtoInProgress.map((s) => (
              <li key={s.id}>
                Order{" "}
                {(s as unknown as { orders?: { order_number?: string } }).orders?.order_number ??
                  s.order_id}{" "}
                is returning to origin (RTO).
              </li>
            ))}
            {alerts.failedEffectsCount > 0 && (
              <li>{alerts.failedEffectsCount} webhook event(s) had a processing error.</li>
            )}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-hairline bg-surface rounded-xl p-5">
          <div className="text-sm font-semibold mb-4">Orders by status</div>
          <div className="flex flex-col gap-2">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-muted">{label}</span>
                <span className="font-medium">{statusCounts[key] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-hairline bg-surface rounded-xl p-5">
          <div className="text-sm font-semibold mb-4">Low stock (≤ {2})</div>
          {lowStock.length === 0 ? (
            <div className="text-sm text-muted">Nothing low right now.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {lowStock.map((v) => {
                const product = (v as unknown as { products?: { title?: string; slug?: string } })
                  .products;
                return (
                  <div key={v.id} className="flex justify-between text-sm">
                    <Link href={`/admin/products/${v.product_id}`} className="hover:underline">
                      {product?.title} — {v.size_label} / {v.frame_finish}
                    </Link>
                    <span className="font-medium text-red-700">{v.stock_qty} left</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="border border-hairline bg-surface rounded-xl p-5">
        <div className="text-sm font-semibold mb-4">
          Action queue — paid, not yet shipped ({actionQueue.paidNotShipped.length})
        </div>
        {actionQueue.paidNotShipped.length === 0 ? (
          <div className="text-sm text-muted">Nothing waiting.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {actionQueue.paidNotShipped.map((o) => (
              <div key={o.id} className="flex justify-between text-sm">
                <Link href={`/admin/orders/${o.id}`} className="hover:underline">
                  {o.order_number}
                </Link>
                <span className="text-muted">{formatPaise(o.total_paise)}</span>
              </div>
            ))}
          </div>
        )}
        {actionQueue.bookedNotPickedUp.length > 0 && (
          <>
            <div className="text-sm font-semibold mt-5 mb-3">
              Booked, no pickup after 48h ({actionQueue.bookedNotPickedUp.length})
            </div>
            <div className="flex flex-col gap-2">
              {actionQueue.bookedNotPickedUp.map((s) => (
                <div key={s.id} className="text-sm text-muted">
                  {(s as unknown as { orders?: { order_number?: string } }).orders?.order_number ??
                    s.order_id}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-hairline bg-surface rounded-xl p-5">
      <div className="text-[11px] tracking-[0.12em] uppercase text-faint mb-2">{label}</div>
      <div className="font-display text-3xl font-medium">{value}</div>
    </div>
  );
}
