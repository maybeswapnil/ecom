import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPaise } from "@/lib/money";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-surface-sunken text-muted",
  paid: "bg-green-100 text-green-800",
  packed: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-hairline text-muted",
  refunded: "bg-amber-100 text-amber-800",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const { status, q, page } = await searchParams;
  const pageNum = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const supabase = createAdminClient();

  let query = supabase
    .from("orders")
    .select("id, order_number, created_at, email, phone, shipping_address, total_paise, status, oversold, paid_after_cancel", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE - 1);

  if (status) query = query.eq("status", status);
  if (q) query = query.or(`order_number.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);

  const { data: orders, count } = await query;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-medium">Orders</h1>
        <form className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search order #, email, phone"
            className="h-10 px-3 border border-border-input bg-surface rounded-md text-sm w-72"
          />
          <select
            name="status"
            defaultValue={status ?? ""}
            className="h-10 px-3 border border-border-input bg-surface rounded-md text-sm"
          >
            <option value="">All statuses</option>
            {Object.keys(STATUS_STYLES).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="h-10 px-4 bg-ink text-paper rounded-md text-sm font-medium"
          >
            Filter
          </button>
        </form>
      </div>

      <div className="border border-hairline rounded-xl overflow-hidden bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-[11px] uppercase tracking-[0.08em] text-faint">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Flags</th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((o) => {
              const address = o.shipping_address as { city?: string } | null;
              return (
                <tr key={o.id} className="border-b border-hairline-soft last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">
                      {o.order_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(o.created_at).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {o.email}
                    <br />
                    <span className="text-xs">{o.phone}</span>
                  </td>
                  <td className="px-4 py-3 text-muted">{address?.city ?? "—"}</td>
                  <td className="px-4 py-3">{formatPaise(o.total_paise)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${STATUS_STYLES[o.status] ?? ""}`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-red-700 text-xs">
                    {o.oversold && <div>Oversold</div>}
                    {o.paid_after_cancel && <div>Paid after cancel</div>}
                  </td>
                </tr>
              );
            })}
            {(orders ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/orders?page=${p}${status ? `&status=${status}` : ""}${q ? `&q=${q}` : ""}`}
              className={`w-8 h-8 flex items-center justify-center rounded-md ${
                p === pageNum ? "bg-ink text-paper" : "text-muted hover:bg-surface-sunken"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
