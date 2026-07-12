import { createAdminClient } from "@/lib/supabase/admin";
import { ReviewModerationRow } from "@/components/admin/ReviewModerationRow";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const supabase = createAdminClient();
  const { data: reviews } = await supabase
    .from("product_reviews")
    .select("id, rating, body, reviewer_name, status, created_at, products(title)")
    .order("created_at", { ascending: false });

  const withTitle = (reviews ?? []).map((r) => ({
    ...r,
    productTitle: (r.products as unknown as { title: string } | null)?.title ?? "—",
  }));
  const pending = withTitle.filter((r) => r.status === "pending");
  const decided = withTitle.filter((r) => r.status !== "pending");

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-3xl font-medium">Reviews</h1>

      <div>
        <div className="text-sm font-semibold mb-3">Pending ({pending.length})</div>
        <div className="flex flex-col gap-3">
          {pending.map((r) => (
            <ReviewModerationRow
              key={r.id}
              id={r.id}
              productTitle={r.productTitle}
              rating={r.rating}
              body={r.body}
              reviewerName={r.reviewer_name}
              status={r.status}
              createdAt={r.created_at}
            />
          ))}
          {pending.length === 0 && <div className="text-sm text-faint italic">Nothing to review.</div>}
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold mb-3">Decided</div>
        <div className="flex flex-col gap-3">
          {decided.map((r) => (
            <ReviewModerationRow
              key={r.id}
              id={r.id}
              productTitle={r.productTitle}
              rating={r.rating}
              body={r.body}
              reviewerName={r.reviewer_name}
              status={r.status}
              createdAt={r.created_at}
            />
          ))}
          {decided.length === 0 && <div className="text-sm text-faint italic">No decisions yet.</div>}
        </div>
      </div>
    </div>
  );
}
