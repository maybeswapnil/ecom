"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { updateHeroImage, updateHeroProduct, resetHeroImage } from "@/lib/admin/hero-actions";
import { DEFAULT_HERO_IMAGE } from "@/lib/config";

export type HeroProductOption = { id: string; title: string };

// The home hero renders this image at 440px wide (aspect 4/5) — 1200×1500
// covers ~2.7× DPR with headroom, and next/image downscales from there.
const OUTPUT_WIDTH_PX = 1200;
const HERO_ASPECT = 4 / 5;
const WEBP_QUALITY = 0.85;

async function cropToWebp(srcUrl: string, area: Area): Promise<Blob | null> {
  const image = document.createElement("img");
  image.src = srcUrl;
  await image.decode();

  const outWidth = Math.min(OUTPUT_WIDTH_PX, Math.round(area.width));
  const outHeight = Math.round(outWidth / HERO_ASPECT);

  const canvas = document.createElement("canvas");
  canvas.width = outWidth;
  canvas.height = outHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, outWidth, outHeight);

  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", WEBP_QUALITY)
  );
}

/** Miniature wireframe of the home-page hero section, with the real image in
 *  place so the uploader sees exactly what the crop will look like in situ. */
function HeroWireframe({ imgSrc }: { imgSrc: string }) {
  return (
    <div className="border border-hairline rounded-lg bg-paper p-5 sm:p-6 flex gap-6 items-center">
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="h-1.5 w-24 bg-hairline rounded-full" />
        <div className="h-4 w-[85%] bg-hairline rounded mt-2.5" />
        <div className="h-4 w-[60%] bg-hairline rounded" />
        <div className="h-2 w-full bg-hairline/60 rounded mt-2.5" />
        <div className="h-2 w-[80%] bg-hairline/60 rounded" />
        <div className="flex gap-2 mt-3.5">
          <div className="h-7 w-28 bg-ink rounded" />
          <div className="h-7 w-16 border border-hairline rounded" />
        </div>
      </div>
      <div className="w-[44%] max-w-[220px] flex-none">
        <div className="relative w-full aspect-[4/5] bg-image-placeholder shadow-[0_18px_36px_-24px_rgba(28,25,21,0.5)]">
          {/* Plain img: the preview is often a blob: URL, which next/image can't optimize. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt="Hero preview"
            className="absolute inset-0 w-full h-full object-cover object-bottom"
          />
        </div>
        <div className="flex justify-between items-baseline mt-2 gap-2">
          <span className="font-display italic text-[11px] text-muted whitespace-nowrap">
            Framed and ready to hang
          </span>
          <span className="text-[8px] tracking-[0.18em] uppercase text-faint whitespace-nowrap">
            Edition of 50
          </span>
        </div>
      </div>
    </div>
  );
}

type HeroImageFormProps = {
  currentUrl: string;
  currentProductId: string | null;
  products: HeroProductOption[];
};

export function HeroImageForm({ currentUrl, currentProductId, products }: HeroImageFormProps) {
  const router = useRouter();
  const [productId, setProductId] = useState(currentProductId ?? "");
  const [linkStatus, setLinkStatus] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropArea, setCropArea] = useState<Area | null>(null);
  const [pending, setPending] = useState<{ blob: Blob; previewUrl: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isCropping = sourceUrl !== null;
  const previewSrc = pending?.previewUrl || currentUrl || DEFAULT_HERO_IMAGE;

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSuccess(null);
    setPending(null);
    setSourceUrl(URL.createObjectURL(file));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    e.target.value = "";
  }

  async function handleApplyCrop() {
    if (!sourceUrl || !cropArea) return;
    setBusy(true);
    setError(null);
    const blob = await cropToWebp(sourceUrl, cropArea);
    setBusy(false);
    if (!blob) {
      setError("Could not crop this image — try a different file.");
      return;
    }
    setPending({ blob, previewUrl: URL.createObjectURL(blob) });
    URL.revokeObjectURL(sourceUrl);
    setSourceUrl(null);
  }

  function handleCancelCrop() {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    setSourceUrl(null);
  }

  async function handleSave() {
    if (!pending) return;
    setBusy(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", new File([pending.blob], "hero.webp", { type: "image/webp" }));
    const result = await updateHeroImage(formData);

    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    URL.revokeObjectURL(pending.previewUrl);
    setPending(null);
    setSuccess("Hero image updated — it's live on the home page.");
    router.refresh();
  }

  async function handleProductChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nextId = e.target.value;
    const previousId = productId;
    setProductId(nextId);
    setLinkStatus(null);

    const result = await updateHeroProduct(nextId || null);
    if (result.error) {
      setProductId(previousId);
      setLinkStatus(result.error);
      return;
    }
    setLinkStatus(nextId ? "Saved — the hero now links to this product." : "Saved — hero is not clickable.");
    router.refresh();
  }

  async function handleReset() {
    setBusy(true);
    setError(null);
    setSuccess(null);
    const result = await resetHeroImage();
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setPending(null);
    setSuccess("Reverted to the default hero image.");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {isCropping ? (
        <>
          <div className="relative w-full h-[380px] bg-ink/90 rounded-lg overflow-hidden">
            <Cropper
              image={sourceUrl}
              crop={crop}
              zoom={zoom}
              aspect={HERO_ASPECT}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, areaPixels) => setCropArea(areaPixels)}
            />
          </div>
          <label className="flex items-center gap-3 text-xs text-muted">
            Zoom
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-ink"
            />
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleApplyCrop}
              disabled={busy}
              className="h-10 px-4 bg-ink text-paper rounded-md text-sm font-medium cursor-pointer disabled:opacity-60"
            >
              {busy ? "Cropping…" : "Apply crop"}
            </button>
            <button
              onClick={handleCancelCrop}
              disabled={busy}
              className="h-10 px-4 border border-border-input text-ink rounded-md text-sm cursor-pointer bg-transparent"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <div>
            <div className="text-[11px] tracking-[0.1em] uppercase text-faint mb-2">
              Home page preview
            </div>
            <HeroWireframe imgSrc={previewSrc} />
          </div>

          {pending && (
            <div className="text-[13px] text-muted">
              This is a preview — the change isn&rsquo;t live until you save.
            </div>
          )}

          <label className="block">
            <span className="text-[11px] tracking-[0.1em] uppercase text-faint block mb-1.5">
              Clicking the hero opens
            </span>
            <select
              value={productId}
              onChange={handleProductChange}
              className="w-full h-10 px-2.5 text-sm border border-border-input rounded-md bg-paper text-ink"
            >
              <option value="">No link (not clickable)</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>
          {linkStatus && <div className="text-[12.5px] text-muted">{linkStatus}</div>}
          {error && <div className="text-[13px] text-red-700">{error}</div>}
          {success && !pending && <div className="text-[13px] text-accent-green">{success}</div>}

          <div className="flex flex-wrap gap-2 items-center">
            <label className="h-10 px-4 inline-flex items-center border border-border-input rounded-md text-sm text-ink cursor-pointer hover:border-ink">
              {pending ? "Choose a different image" : "Upload new image"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            {pending && (
              <button
                onClick={handleSave}
                disabled={busy}
                className="h-10 px-4 bg-ink text-paper rounded-md text-sm font-medium cursor-pointer disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save hero image"}
              </button>
            )}
            {!pending && currentUrl && (
              <button
                onClick={handleReset}
                disabled={busy}
                className="h-10 px-4 border border-border-input text-muted rounded-md text-sm cursor-pointer bg-transparent hover:text-ink"
              >
                {busy ? "Reverting…" : "Use default image"}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
