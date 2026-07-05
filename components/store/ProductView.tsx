"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ProductVariant, ProductWithVariants } from "@/lib/types";
import { formatPaise } from "@/lib/money";
import { useCartStore } from "@/lib/cart-store";
import { useCartUiStore } from "@/lib/cart-ui-store";

const SIZE_DIMENSIONS: Record<string, { cm: string; in: string; scale: number }> = {
  A4: { cm: "21 × 30 cm", in: "8 × 12 in", scale: 0.4 },
  A3: { cm: "30 × 42 cm", in: "12 × 17 in", scale: 0.55 },
  A2: { cm: "42 × 59 cm", in: "17 × 23 in", scale: 0.75 },
  A1: { cm: "59 × 84 cm", in: "23 × 33 in", scale: 1 },
};

const FINISH_SWATCH: Record<string, { hex: string; keyline?: boolean }> = {
  Black: { hex: "#2A2723" },
  White: { hex: "#F2EFE8", keyline: true },
  Oak: { hex: "#C6A671" },
  Walnut: { hex: "#63452F" },
};

const VIEW_LABELS = ["Framed", "Print", "Detail", "In room"];

type Props = {
  product: ProductWithVariants;
  variants: ProductVariant[];
  place: string;
  year: string;
  ratio: string;
};

export function ProductView({ product, variants, place, year, ratio }: Props) {
  const sizeLabels = useMemo(
    () => [...new Set(variants.map((v) => v.size_label))],
    [variants]
  );
  const [sizeLabel, setSizeLabel] = useState(sizeLabels[Math.min(1, sizeLabels.length - 1)]);
  const finishesForSize = useMemo(
    () => variants.filter((v) => v.size_label === sizeLabel),
    [variants, sizeLabel]
  );
  const [finishName, setFinishName] = useState(finishesForSize[0]?.frame_finish);
  const [viewIdx, setViewIdx] = useState(0);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [showSticky, setShowSticky] = useState(false);

  const activeVariant =
    variants.find((v) => v.size_label === sizeLabel && v.frame_finish === finishName) ??
    finishesForSize[0];

  const addLine = useCartStore((s) => s.addLine);
  const setCartOpen = useCartUiStore((s) => s.setOpen);
  const [justAdded, setJustAdded] = useState(false);

  const ctaRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    const el = ctaRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (!activeVariant) return null;

  const mainImage = product.images[0];
  const mainImg = mainImage?.url ?? "";
  const mainImgAlt = mainImage?.alt || product.title;
  const finish = FINISH_SWATCH[finishName] ?? FINISH_SWATCH.Black;
  const dims = SIZE_DIMENSIONS[sizeLabel] ?? SIZE_DIMENSIONS.A4;

  function handleAddToCart() {
    if (!activeVariant) return;
    addLine(activeVariant.sku, {
      title: product.title,
      sizeLabel,
      finish: finishName,
      pricePaise: activeVariant.price_paise,
      image: mainImg,
      slug: product.slug,
    });
    setJustAdded(true);
    setCartOpen(true);
    setTimeout(() => setJustAdded(false), 1800);
  }

  return (
    <section className="max-w-[1320px] mx-auto px-7 pt-11 pb-22">
      <div className="text-xs text-faint mb-8.5 tracking-[0.04em]">
        <Link href="/prints" className="bg-transparent text-muted text-xs p-0 tracking-[0.04em] whitespace-nowrap hover:text-ink">
          The collection
        </Link>
        <span className="mx-2.5">·</span>
        <span className="text-ink">{product.title}</span>
      </div>

      <div className="flex flex-col md:flex-row gap-9 md:gap-18 items-start">
        {/* Gallery */}
        <div className="w-full md:flex-[1_1_56%] md:sticky md:top-[104px]">
          <div className="bg-surface-sunken rounded-2xl p-5 md:p-13 flex items-center justify-center">
            {viewIdx === 0 && (
              <div
                className="p-[6px] md:p-[8px] w-full max-w-[640px]"
                style={{
                  background: finish.hex,
                  boxShadow:
                    (finish.keyline ? "inset 0 0 0 1px #DCD5C6, " : "") +
                    "0 34px 68px -42px rgba(28,25,21,0.6)",
                }}
              >
                <div className="bg-surface p-[7%]">
                  <div className="relative w-full bg-image-placeholder" style={{ aspectRatio: ratio }}>
                    {mainImg && (
                      <Image
                        src={mainImg}
                        alt={mainImgAlt}
                        fill
                        priority
                        sizes="640px"
                        className="object-cover"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
            {viewIdx === 1 && (
              <div className="w-full max-w-[640px] shadow-[0_30px_60px_-40px_rgba(28,25,21,0.55)]">
                <div className="relative w-full" style={{ aspectRatio: ratio }}>
                  {mainImg && (
                    <Image src={mainImg} alt={mainImgAlt} fill sizes="640px" className="object-cover" />
                  )}
                </div>
              </div>
            )}
            {viewIdx === 2 && mainImg && (
              <div className="w-full max-w-[640px] aspect-square overflow-hidden shadow-[0_30px_60px_-40px_rgba(28,25,21,0.55)]">
                <div className="relative w-full h-full">
                  <Image
                    src={mainImg}
                    alt="Paper detail"
                    fill
                    sizes="640px"
                    className="object-cover scale-[2.4]"
                  />
                </div>
              </div>
            )}
            {viewIdx === 3 && (
              <div className="w-full max-w-[640px] aspect-[4/3] relative bg-image-placeholder border border-hairline flex items-center justify-center text-muted text-sm">
                Room view coming soon
              </div>
            )}
          </div>
          <div className="flex gap-3.5 mt-4.5 overflow-x-auto [scroll-snap-type:x_mandatory] p-0.5">
            {VIEW_LABELS.map((label, i) => (
              <button
                key={label}
                onClick={() => setViewIdx(i)}
                className="flex-none [scroll-snap-align:start] cursor-pointer bg-transparent border-none p-0 flex flex-col gap-1.5 items-center"
                style={{ opacity: i === viewIdx ? 1 : 0.55 }}
              >
                {i < 3 && mainImg ? (
                  <div className="relative w-16 h-16">
                    <Image src={mainImg} alt={label} fill sizes="64px" className="object-cover" />
                  </div>
                ) : (
                  <span className="w-16 h-16 flex items-center justify-center bg-surface-sunken text-muted text-lg">
                    ⌂
                  </span>
                )}
                <span
                  className="text-[10.5px] tracking-[0.1em] uppercase pb-0.5 border-b"
                  style={{
                    color: i === viewIdx ? "var(--color-ink)" : "var(--color-faint)",
                    borderColor: i === viewIdx ? "var(--color-ink)" : "transparent",
                  }}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="w-full md:flex-[1_1_40%] md:max-w-[460px] pb-20 md:pb-0">
          <div className="text-[11px] tracking-[0.28em] uppercase text-muted font-medium mb-4">
            {place} · {year}
          </div>
          <h1 className="font-display font-medium text-[clamp(36px,4.2vw,52px)] leading-[1.06] m-0 mb-3 tracking-[-0.01em]">
            {product.title}
          </h1>
          {product.description && (
            <p className="font-display italic text-lg text-muted m-0 mb-7 leading-snug">
              {product.description}
            </p>
          )}

          <div className="flex items-baseline gap-3 pb-6.5 mb-7 border-b border-hairline">
            <span className="font-display text-4xl font-medium leading-none">
              {formatPaise(activeVariant.price_paise)}
            </span>
            <span className="text-[12.5px] text-faint">
              {sizeLabel} · {finishName} frame · incl. taxes
            </span>
          </div>

          {/* Size */}
          <div className="mb-7.5">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[11px] tracking-[0.22em] uppercase text-muted font-semibold">
                Size
              </span>
              <button
                onClick={() => setSizeGuideOpen((v) => !v)}
                className="bg-transparent border-none text-ink text-[12.5px] cursor-pointer border-b border-border-input pb-px hover:opacity-60"
              >
                {sizeGuideOpen ? "Hide size guide" : "Size guide"}
              </button>
            </div>
            <div className="flex flex-col gap-2.5">
              {sizeLabels.map((label) => {
                const v = variants.find(
                  (x) => x.size_label === label && x.frame_finish === finishName
                ) ?? variants.find((x) => x.size_label === label);
                const dim = SIZE_DIMENSIONS[label];
                const sel = label === sizeLabel;
                return (
                  <button
                    key={label}
                    onClick={() => setSizeLabel(label)}
                    className={`flex items-center justify-between px-4.5 py-4 cursor-pointer w-full rounded-md border font-body text-ink bg-transparent ${
                      sel ? "border-ink" : "border-hairline"
                    }`}
                  >
                    <span className="flex items-baseline gap-3.5">
                      <span className="font-semibold text-sm min-w-[26px] text-left">{label}</span>
                      <span className="text-[13px] text-muted">
                        {dim?.cm} · {dim?.in}
                      </span>
                    </span>
                    <span className="font-display text-lg">
                      {v ? formatPaise(v.price_paise) : "—"}
                    </span>
                  </button>
                );
              })}
            </div>
            {sizeGuideOpen && (
              <div className="mt-4 p-5.5 bg-surface-sunken rounded-[10px]">
                <div className="text-[11px] tracking-[0.18em] uppercase text-muted font-semibold mb-4">
                  On a wall
                </div>
                <div className="flex items-end gap-5">
                  <div className="flex-1 relative h-[120px] border-b border-border-input bg-paper flex items-end justify-center p-2.5 pt-0 rounded-t-md">
                    <div
                      style={{
                        width: `${26 + dims.scale * 52}%`,
                        height: `${ratio === "4/5" ? (26 + dims.scale * 52) * 1.05 : (26 + dims.scale * 52) * 0.6}%`,
                        maxHeight: "84px",
                        background: finish.hex,
                        boxShadow: "0 5px 10px -5px rgba(0,0,0,0.4)",
                      }}
                    />
                    <div className="absolute left-2.5 bottom-1 text-[10.5px] text-faint">
                      Sofa ≈ 200 cm
                    </div>
                  </div>
                  <div className="text-[12.5px] text-muted-soft leading-relaxed max-w-[180px]">
                    Framed <strong>{sizeLabel}</strong> measures <strong>{dims.cm}</strong> ({dims.in})
                    including frame.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Finish */}
          <div className="mb-8">
            <div className="flex items-baseline gap-3 mb-3.5">
              <span className="text-[11px] tracking-[0.22em] uppercase text-muted font-semibold">
                Frame
              </span>
              <span className="font-display italic text-base text-ink">{finishName}</span>
            </div>
            <div className="flex gap-4.5">
              {[...new Set(finishesForSize.map((v) => v.frame_finish))].map((name) => {
                const sel = name === finishName;
                const swatch = FINISH_SWATCH[name] ?? FINISH_SWATCH.Black;
                return (
                  <button
                    key={name}
                    onClick={() => setFinishName(name)}
                    className="flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer p-1 min-w-11 min-h-11"
                  >
                    <span
                      className="block w-8 h-8 rounded-full"
                      style={{
                        background: swatch.hex,
                        boxShadow:
                          (swatch.keyline ? "inset 0 0 0 1px #DCD5C6, " : "") +
                          (sel
                            ? "0 0 0 3px var(--color-paper), 0 0 0 4px var(--color-ink)"
                            : "0 0 0 1px var(--color-hairline)"),
                      }}
                    />
                    <span
                      className="text-[11px]"
                      style={{
                        color: sel ? "var(--color-ink)" : "var(--color-faint)",
                        fontWeight: sel ? 600 : 400,
                      }}
                    >
                      {name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            ref={ctaRef}
            onClick={handleAddToCart}
            className="w-full h-[58px] bg-ink text-paper rounded-md font-body font-medium text-[15.5px] cursor-pointer flex items-center justify-center gap-3 hover:bg-ink-soft active:scale-[0.995]"
          >
            <span>{justAdded ? "Added ✓" : "Add to cart"}</span>
            <span className="opacity-45">—</span>
            <span>{formatPaise(activeVariant.price_paise)}</span>
          </button>
          <div className="mt-4 text-[13px] text-muted">
            Dispatches in 3–4 days · delivered in{" "}
            <span className="text-ink">5–7 days</span> to most metros
          </div>

          <div className="mt-8.5 pt-7 border-t border-hairline">
            <div className="grid grid-cols-2 gap-4.5 gap-x-7">
              {[
                { k: "Paper", v: "Archival cotton rag, 310 gsm" },
                { k: "Ink", v: "Pigment, 100-year rated" },
                {
                  k: "Frame",
                  v: `${finishName} — ${finishName === "Oak" || finishName === "Walnut" ? "solid wood" : "aluminium"}`,
                },
                { k: "Edition", v: "Limited to 50, signed" },
              ].map((sp) => (
                <div key={sp.k}>
                  <div className="text-[10.5px] tracking-[0.16em] uppercase text-faint mb-1">
                    {sp.k}
                  </div>
                  <div className="text-sm text-ink leading-snug">{sp.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 gap-x-6 mt-7.5 pt-5.5 border-t border-hairline">
            {["Secure payment", "Insured shipping", "14-day returns"].map((t) => (
              <span key={t} className="text-xs text-muted tracking-[0.02em]">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {product.story && (
        <div className="max-w-[720px] mx-auto mt-20 pt-16 border-t border-hairline">
          <div className="text-[11px] tracking-[0.32em] uppercase text-muted font-medium mb-6 text-center">
            The story behind this print
          </div>
          <p className="font-display text-xl md:text-2xl leading-[1.6] text-ink text-center whitespace-pre-line">
            {product.story}
          </p>
        </div>
      )}

      {/* Sticky mobile CTA */}
      {showSticky && (
        <div className="fixed left-0 right-0 bottom-0 z-50 bg-paper/97 backdrop-blur-md border-t border-hairline py-3 px-4.5 flex items-center gap-3.5 pc-fade-in md:hidden">
          <div className="flex-1 min-w-0">
            <div className="font-display text-[17px] font-medium leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
              {product.title}
            </div>
            <div className="text-[11.5px] text-muted">
              {sizeLabel} · {finishName} · {formatPaise(activeVariant.price_paise)}
            </div>
          </div>
          <button
            onClick={handleAddToCart}
            className="h-11.5 px-5.5 bg-ink text-paper rounded-md font-body font-medium text-sm cursor-pointer whitespace-nowrap hover:bg-ink-soft"
          >
            Add to cart
          </button>
        </div>
      )}
    </section>
  );
}
