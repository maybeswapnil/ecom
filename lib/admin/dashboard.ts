import { createAdminClient } from "@/lib/supabase/admin";
import { LOW_STOCK_THRESHOLD } from "@/lib/config";

export async function getDashboardData() {
  const supabase = createAdminClient();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [revenueToday, revenue7d, revenue30d, statusCounts, actionQueue, lowStock, alerts] =
    await Promise.all([
      revenueSince(supabase, startOfToday),
      revenueSince(supabase, sevenDaysAgo),
      revenueSince(supabase, thirtyDaysAgo),
      orderStatusCounts(supabase),
      getActionQueue(supabase),
      getLowStock(supabase),
      getAlerts(supabase),
    ]);

  return { revenueToday, revenue7d, revenue30d, statusCounts, actionQueue, lowStock, alerts };
}

async function revenueSince(supabase: ReturnType<typeof createAdminClient>, sinceIso: string) {
  const { data: paid } = await supabase
    .from("orders")
    .select("total_paise")
    .gte("paid_at", sinceIso)
    .not("paid_at", "is", null);
  const { data: refunds } = await supabase
    .from("refunds")
    .select("amount_paise, order_id, orders!inner(paid_at)")
    .gte("created_at", sinceIso);

  const grossPaise = (paid ?? []).reduce((sum, o) => sum + o.total_paise, 0);
  const refundedPaise = (refunds ?? []).reduce((sum, r) => sum + r.amount_paise, 0);
  return grossPaise - refundedPaise;
}

async function orderStatusCounts(supabase: ReturnType<typeof createAdminClient>) {
  const { data } = await supabase.from("orders").select("status");
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }
  return counts;
}

async function getActionQueue(supabase: ReturnType<typeof createAdminClient>) {
  const { data: paidNotShipped } = await supabase
    .from("orders")
    .select("id, order_number, created_at, total_paise")
    .in("status", ["paid", "packed"])
    .order("created_at", { ascending: true })
    .limit(20);

  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data: shipments } = await supabase
    .from("shipments")
    .select("id, order_id, booked_at, status, orders(order_number)")
    .eq("active", true)
    .in("status", ["booked", "pickup_scheduled"])
    .lt("booked_at", fortyEightHoursAgo);

  return {
    paidNotShipped: paidNotShipped ?? [],
    bookedNotPickedUp: shipments ?? [],
  };
}

async function getLowStock(supabase: ReturnType<typeof createAdminClient>) {
  const { data } = await supabase
    .from("product_variants")
    .select("id, sku, size_label, frame_finish, stock_qty, product_id, products(title, slug)")
    .eq("active", true)
    .lte("stock_qty", LOW_STOCK_THRESHOLD)
    .order("stock_qty", { ascending: true });
  return data ?? [];
}

async function getAlerts(supabase: ReturnType<typeof createAdminClient>) {
  const { data: oversold } = await supabase
    .from("orders")
    .select("id, order_number")
    .eq("oversold", true);

  const { data: paidAfterCancel } = await supabase
    .from("orders")
    .select("id, order_number")
    .eq("paid_after_cancel", true);

  const { data: rtoInProgress } = await supabase
    .from("shipments")
    .select("id, order_id, status, orders(order_number)")
    .in("status", ["rto_in_transit"])
    .eq("active", true);

  const { data: failedEffects } = await supabase
    .from("webhook_events")
    .select("id")
    .not("payload->processing_error", "is", null)
    .limit(20);

  return {
    oversold: oversold ?? [],
    paidAfterCancel: paidAfterCancel ?? [],
    rtoInProgress: rtoInProgress ?? [],
    failedEffectsCount: (failedEffects ?? []).length,
  };
}
