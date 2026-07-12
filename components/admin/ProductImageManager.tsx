"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadProductImage, updateProductImages } from "@/lib/admin/product-actions";
import type { ProductImage, ProductImageRole } from "@/lib/types";
import { PRODUCT_IMAGE_ROLE_LABELS } from "@/lib/types";

// Vercel serverless functions hard-cap request bodies at 4.5MB platform-wide
// (no app config can raise it), so files must stay comfortably under that —
// checked client-side to avoid ever sending a request Vercel will 413 anyway.
const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024;

// Stored images are fetched in full by the next/image optimizer on every cache
// miss, so multi-MB camera originals directly slow the storefront. Downscale
// and re-encode in the browser before upload; 2000px covers the largest
// rendered size (~1280px hero on retina) with headroom.
const MAX_IMAGE_EDGE_PX = 2000;
const RECOMPRESS_THRESHOLD_BYTES = 500 * 1024;
const WEBP_QUALITY = 0.85;

async function resizeForUpload(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_IMAGE_EDGE_PX / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= RECOMPRESS_THRESHOLD_BYTES) {
      bitmap.close();
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY)
    );
    // Keep the original when encoding fails or doesn't actually shrink it.
    if (!blob || blob.size >= file.size) return file;
    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.webp`, { type: "image/webp" });
  } catch {
    return file; // unreadable as an image — let the server-side validation decide
  }
}

const ROLE_ORDER: ProductImageRole[] = ["framed", "print", "detail", "room"];

const ROLE_HELP: Record<ProductImageRole, string> = {
  framed: "Product page's main tab — the print in its frame, straight-on.",
  print: "Flat, unframed print — shows the image itself with no frame.",
  detail: "Close-up crop of paper texture or a corner of the print.",
  room: "The framed print shown hanging in a room or lifestyle setting.",
};

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
      // Resize before the size check — a large original often shrinks under the cap.
      const upload = await resizeForUpload(file);
      if (upload.size > MAX_FILE_SIZE_BYTES) {
        failures.push(`${file.name}: Image must be 4MB or smaller.`);
        setUploadProgress((prev) => (prev ? { ...prev, done: prev.done + 1 } : prev));
        continue;
      }
      const formData = new FormData();
      formData.append("file", upload);
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

  function handleRoleChange(index: number, role: string) {
    const next = localImages.map((img, i) =>
      i === index ? { ...img, role: (role || undefined) as ProductImageRole | undefined } : img
    );
    persist(next);
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
  const hasFramedRole = localImages.some((img) => img.role === "framed");
  const usedRoles = new Set(localImages.map((img) => img.role).filter(Boolean));

  return (
    <div className="border border-hairline bg-surface rounded-xl p-5">
      <div className="text-sm font-semibold mb-3">Images</div>
      <div className="text-xs text-muted mb-3 leading-relaxed">
        Select multiple files to upload them all at once (4MB max per image). For each image,
        choose what it shows using the dropdown below it — this controls which tab it appears
        under on the product page:
      </div>
      <ul className="text-xs text-muted mb-3 leading-relaxed list-none flex flex-col gap-1">
        {ROLE_ORDER.map((role) => (
          <li key={role}>
            <span className="font-medium text-ink">{PRODUCT_IMAGE_ROLE_LABELS[role]}</span> —{" "}
            {ROLE_HELP[role]}
          </li>
        ))}
      </ul>
      <div className="text-xs text-muted mb-3">
        Images left as &ldquo;Unassigned&rdquo; are stored but won&rsquo;t appear on any tab.
        Drag to reorder. Alt text is required for every image.
      </div>

      {!hasFramedRole && localImages.length > 0 && (
        <div className="text-xs text-red-700 mb-3">
          No image is set as &ldquo;Framed hero&rdquo; — the product page&rsquo;s main image will
          be blank until one is assigned.
        </div>
      )}
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
              <Image
                src={img.url}
                alt={img.alt || ""}
                fill
                sizes="56px"
                className="object-cover rounded"
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <select
                value={img.role ?? ""}
                onChange={(e) => handleRoleChange(i, e.target.value)}
                className={`w-full h-8 px-2 text-xs border rounded bg-paper ${
                  img.role ? "border-border-input" : "border-amber-400"
                }`}
              >
                <option value="">Unassigned</option>
                {ROLE_ORDER.map((role) => (
                  <option key={role} value={role} disabled={usedRoles.has(role) && img.role !== role}>
                    {PRODUCT_IMAGE_ROLE_LABELS[role]}
                    {usedRoles.has(role) && img.role !== role ? " (already used)" : ""}
                  </option>
                ))}
              </select>
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
