"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadProductImage, updateProductImages } from "@/lib/admin/product-actions";
import type { ProductImage } from "@/lib/types";

export function ProductImageManager({
  productId,
  images,
}: {
  productId: string;
  images: ProductImage[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localImages, setLocalImages] = useState<ProductImage[]>(images);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  async function persist(next: ProductImage[]) {
    setLocalImages(next);
    const result = await updateProductImages(productId, next);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setError(null);
    setUploading(true);
    setUploadProgress({ done: 0, total: files.length });

    const uploaded: ProductImage[] = [];
    const failures: string[] = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadProductImage(productId, formData);
      if (result.error || !result.url) {
        failures.push(`${file.name}: ${result.error ?? "Upload failed"}`);
      } else {
        uploaded.push({ url: result.url, alt: "" });
      }
      setUploadProgress((prev) => (prev ? { ...prev, done: prev.done + 1 } : prev));
    }

    setUploading(false);
    setUploadProgress(null);
    if (failures.length > 0) setError(failures.join("; "));
    if (uploaded.length > 0) await persist([...localImages, ...uploaded]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleRemove(index: number) {
    persist(localImages.filter((_, i) => i !== index));
  }

  function handleAltChange(index: number, alt: string) {
    const next = localImages.map((img, i) => (i === index ? { ...img, alt } : img));
    setLocalImages(next);
  }

  function handleAltBlur() {
    persist(localImages);
  }

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDrop(index: number) {
    if (dragIndex === null || dragIndex === index) return;
    const next = [...localImages];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    setDragIndex(null);
    persist(next);
  }

  const missingAlt = localImages.filter((img) => !img.alt.trim()).length;

  return (
    <div className="border border-hairline bg-surface rounded-xl p-5">
      <div className="text-sm font-semibold mb-3">Images</div>
      <div className="text-xs text-muted mb-3">
        Select multiple files to upload them all at once. Drag to reorder. First image is the
        hero/cover shown on the shop grid. Alt text is required for every image.
      </div>
      {missingAlt > 0 && (
        <div className="text-xs text-red-700 mb-3">
          {missingAlt} image(s) missing alt text.
        </div>
      )}

      <div className="flex flex-col gap-2 mb-4">
        {localImages.map((img, i) => (
          <div
            key={img.url}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(i)}
            className="flex items-start gap-3 border border-hairline rounded-md p-2 bg-paper cursor-move"
          >
            <div className="relative w-14 h-14 flex-none">
              <Image src={img.url} alt={img.alt || ""} fill className="object-cover rounded" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="text-xs text-muted">{i === 0 ? "Hero image" : `Image ${i + 1}`}</div>
              <input
                value={img.alt}
                onChange={(e) => handleAltChange(i, e.target.value)}
                onBlur={handleAltBlur}
                placeholder="Alt text (required)"
                className={`w-full h-8 px-2 text-xs border rounded ${
                  img.alt.trim() ? "border-border-input" : "border-red-400"
                }`}
              />
            </div>
            <button
              onClick={() => handleRemove(i)}
              className="text-xs text-red-700 bg-transparent border-none cursor-pointer flex-none"
            >
              Remove
            </button>
          </div>
        ))}
        {localImages.length === 0 && (
          <div className="text-sm text-muted italic py-6 text-center border border-dashed border-hairline rounded-md">
            No images yet.
          </div>
        )}
      </div>

      {error && <div className="text-[13px] text-red-700 mb-2">{error}</div>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFileSelect}
        disabled={uploading}
        className="text-xs"
      />
      {uploadProgress && (
        <div className="text-xs text-muted mt-2">
          Uploading {uploadProgress.done}/{uploadProgress.total}…
        </div>
      )}
    </div>
  );
}
