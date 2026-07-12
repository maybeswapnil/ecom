"use client";

import { useState, useTransition } from "react";
import { submitReview } from "@/lib/review-actions";

type ExistingReview = { rating: number; body: string | null; reviewer_name: string } | null;

export function ReviewForm({
  orderNumber,
  token,
  productId,
  title,
  existing,
}: {
  orderNumber: string;
  token: string;
  productId: string;
  title: string;
  existing: ExistingReview;
}) {
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [body, setBody] = useState(existing?.body ?? "");
  const [reviewerName, setReviewerName] = useState(existing?.reviewer_name ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitReview(orderNumber, token, {
        productId,
        rating,
        body,
        reviewerName,
      });
      if (result.error) setError(result.error);
      else setSubmitted(true);
    });
  }

  const displayRating = hoverRating || rating;

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-hairline rounded-xl p-6 flex flex-col gap-4"
    >
      <div className="font-display text-lg font-medium">{title}</div>

      <div className="flex gap-1.5" role="radiogroup" aria-label="Star rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={rating === star}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="bg-transparent border-none cursor-pointer p-0 text-2xl leading-none"
          >
            <span className={star <= displayRating ? "text-ink" : "text-hairline"}>★</span>
          </button>
        ))}
      </div>

      <label className="block">
        <span className="text-[11px] tracking-[0.1em] uppercase text-faint block mb-1.5">
          Your name
        </span>
        <input
          type="text"
          value={reviewerName}
          onChange={(e) => setReviewerName(e.target.value)}
          className="w-full h-11 px-3.5 border border-border-input bg-surface rounded-md font-body text-[15px] text-ink focus:outline-none focus:border-ink"
        />
      </label>

      <label className="block">
        <span className="text-[11px] tracking-[0.1em] uppercase text-faint block mb-1.5">
          Review (optional)
        </span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          className="w-full px-3.5 py-2.5 border border-border-input bg-surface rounded-md font-body text-[15px] text-ink focus:outline-none focus:border-ink resize-none"
        />
      </label>

      {error && (
        <div className="text-[12.5px] text-red-700" role="alert">
          {error}
        </div>
      )}
      {submitted && !error && (
        <div className="text-[12.5px] text-green-700">
          Thanks — your review is in for moderation.
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || rating === 0 || !reviewerName.trim()}
        className="h-11 px-5 bg-ink text-paper rounded-md font-body font-medium text-sm self-start disabled:opacity-50"
      >
        {isPending ? "Submitting…" : existing ? "Update review" : "Submit review"}
      </button>
    </form>
  );
}
