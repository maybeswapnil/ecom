"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct } from "@/lib/admin/product-actions";

export function NewProductForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleTitleChange(value: string) {
    setTitle(value);
    setSlug(
      value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
    );
  }

  async function handleCreate() {
    setError(null);
    setSubmitting(true);
    const result = await createProduct({ slug, title, tags: [] });
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    router.push(`/admin/products/${result.id}`);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="h-10 px-4 bg-ink text-paper rounded-md text-sm font-medium"
      >
        New product
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        placeholder="Title"
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        className="h-10 px-3 border border-border-input bg-surface rounded-md text-sm w-56"
      />
      <input
        placeholder="slug"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        className="h-10 px-3 border border-border-input bg-surface rounded-md text-sm w-48"
      />
      <button
        onClick={handleCreate}
        disabled={submitting || !title || !slug}
        className="h-10 px-4 bg-ink text-paper rounded-md text-sm font-medium disabled:opacity-50"
      >
        Create
      </button>
      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  );
}
