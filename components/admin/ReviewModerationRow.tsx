"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setReviewStatus } from "@/lib/admin/review-actions";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-surface-sunken text-muted",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-hairline text-muted",
};

export function ReviewModerationRow({
  id,
  productTitle,
  rating,
  body,
  reviewerName,
  status,
  createdAt,
}: {
  id: string;
  productTitle: string;
  rating: number;
  body: string | null;
  reviewerName: string;
  status: string;
  createdAt: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function decide(next: "approved" | "rejected") {
    setError(null);
    startTransition(async () => {
      const result = await setReviewStatus(id, next);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="border border-hairline rounded-xl p-4 bg-surface flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="font-medium text-sm">{productTitle}</span>
          <span className="text-ink text-sm" aria-label={`${rating} out of 5 stars`}>
            {"★".repeat(rating)}
            <span className="text-hairline">{"★".repeat(5 - rating)}</span>
          </span>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_STYLES[status] ?? ""}`}>
          {status}
        </span>
      </div>
      <div className="text-xs text-muted">
        {reviewerName} · {new Date(createdAt).toLocaleDateString("en-IN")}
      </div>
      {body && <p className="text-sm text-ink m-0">{body}</p>}
      {error && <div className="text-xs text-red-700">{error}</div>}
      {status === "pending" && (
        <div className="flex gap-2 mt-1">
          <button
            onClick={() => decide("approved")}
            disabled={isPending}
            className="h-8 px-3 bg-ink text-paper rounded text-xs font-medium disabled:opacity-50"
          >
            Approve
          </button>
          <button
            onClick={() => decide("rejected")}
            disabled={isPending}
            className="h-8 px-3 bg-transparent border border-border-input rounded text-xs disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
