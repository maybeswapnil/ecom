import type { ProductReview } from "@/lib/types";

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} out of 5 stars`}>
      <span className="text-ink">{"★".repeat(rating)}</span>
      <span className="text-hairline">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export function ProductReviews({
  reviews,
  average,
}: {
  reviews: ProductReview[];
  average: number | null;
}) {
  if (reviews.length === 0) return null;

  return (
    <div className="max-w-[1320px] mx-auto px-7 py-14 border-t border-hairline">
      <div className="flex items-baseline gap-3.5 mb-8">
        <h2 className="font-display text-2xl font-medium m-0">Reviews</h2>
        {average !== null && (
          <span className="text-muted text-sm">
            <Stars rating={Math.round(average)} /> {average.toFixed(1)} · {reviews.length} review
            {reviews.length === 1 ? "" : "s"}
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.map((r) => (
          <div key={r.id} className="border border-hairline rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">{r.reviewer_name}</span>
              <Stars rating={r.rating} />
            </div>
            {r.body && <p className="text-[14px] text-muted-soft leading-relaxed m-0">{r.body}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
