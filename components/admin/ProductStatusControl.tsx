"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setProductStatus } from "@/lib/admin/product-actions";

const OPTIONS: { value: "draft" | "live" | "archived"; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "live", label: "Live" },
  { value: "archived", label: "Archived" },
];

export function ProductStatusControl({
  productId,
  status,
}: {
  productId: string;
  status: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(value: string) {
    setError(null);
    startTransition(async () => {
      const result = await setProductStatus(productId, value as "draft" | "live" | "archived");
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-700">{error}</span>}
      <select
        value={status}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value)}
        className="h-10 px-3 border border-border-input bg-surface rounded-md text-sm font-medium"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
