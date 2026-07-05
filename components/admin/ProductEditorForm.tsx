"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProduct } from "@/lib/admin/product-actions";
import type { Product } from "@/lib/types";

export function ProductEditorForm({ product }: { product: Product }) {
  const router = useRouter();
  const place = product.tags.find((t) => t.startsWith("place:"))?.slice(6) ?? "";
  const year = product.tags.find((t) => t.startsWith("year:"))?.slice(5) ?? "";
  const orient = product.tags.includes("portrait") ? "portrait" : "landscape";
  const tone = product.tags.includes("bw") ? "bw" : "colour";

  const [form, setForm] = useState({
    title: product.title,
    description: product.description ?? "",
    story: product.story ?? "",
    place,
    year,
    orient,
    tone,
  });
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSubmitting(true);
    setError(null);
    setSaved(false);

    const tags = [
      form.place ? `place:${form.place}` : null,
      form.year ? `year:${form.year}` : null,
      form.orient,
      form.tone,
    ].filter((t): t is string => !!t);

    const result = await updateProduct(product.id, {
      title: form.title,
      description: form.description,
      story: form.story,
      tags,
    });

    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="border border-hairline bg-surface rounded-xl p-5 flex flex-col gap-3.5">
      <div className="text-sm font-semibold">Details</div>

      <Field label="Title">
        <input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="w-full h-10 px-3 border border-border-input bg-paper rounded-md text-sm"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3.5">
        <Field label="Place">
          <input
            value={form.place}
            onChange={(e) => setForm((f) => ({ ...f, place: e.target.value }))}
            placeholder="e.g. Ladakh"
            className="w-full h-10 px-3 border border-border-input bg-paper rounded-md text-sm"
          />
        </Field>
        <Field label="Year">
          <input
            value={form.year}
            onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
            placeholder="e.g. 2023"
            className="w-full h-10 px-3 border border-border-input bg-paper rounded-md text-sm"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <Field label="Orientation">
          <select
            value={form.orient}
            onChange={(e) => setForm((f) => ({ ...f, orient: e.target.value }))}
            className="w-full h-10 px-3 border border-border-input bg-paper rounded-md text-sm"
          >
            <option value="landscape">Landscape</option>
            <option value="portrait">Portrait</option>
          </select>
        </Field>
        <Field label="Palette">
          <select
            value={form.tone}
            onChange={(e) => setForm((f) => ({ ...f, tone: e.target.value }))}
            className="w-full h-10 px-3 border border-border-input bg-paper rounded-md text-sm"
          >
            <option value="bw">Black &amp; white</option>
            <option value="colour">Colour</option>
          </select>
        </Field>
      </div>

      <Field label="Caption / description">
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={2}
          className="w-full px-3 py-2 border border-border-input bg-paper rounded-md text-sm"
        />
      </Field>

      <Field label="Story">
        <textarea
          value={form.story}
          onChange={(e) => setForm((f) => ({ ...f, story: e.target.value }))}
          rows={4}
          className="w-full px-3 py-2 border border-border-input bg-paper rounded-md text-sm"
        />
      </Field>

      {error && <div className="text-[13px] text-red-700">{error}</div>}

      <button
        onClick={handleSave}
        disabled={submitting}
        className="self-start h-10 px-4 bg-ink text-paper rounded-md text-sm font-medium disabled:opacity-50"
      >
        {submitting ? "Saving…" : saved ? "Saved ✓" : "Save details"}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] tracking-[0.1em] uppercase text-faint block mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
