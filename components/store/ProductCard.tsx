import Link from "next/link";
import Image from "next/image";
import type { ProductWithVariants } from "@/lib/types";
import { distinctSizes } from "@/lib/catalog";
import { formatPaise } from "@/lib/money";

function firstImage(product: ProductWithVariants) {
  return product.images.find((img) => img.role === "framed") ?? product.images[0];
}

function ratioFor(product: ProductWithVariants): string {
  return (product.tags.includes("portrait") ? "4/5" : "3/2");
}

export function ProductCard({ product }: { product: ProductWithVariants }) {
  const sizes = distinctSizes(product);
  const fromPrice = sizes.length ? Math.min(...sizes.map((s) => s.price_paise)) : 0;
  const place = product.tags.find((t) => t.startsWith("place:"))?.slice(6) ?? "";
  const year = product.tags.find((t) => t.startsWith("year:"))?.slice(5) ?? "";
  const image = firstImage(product);

  return (
    <Link href={`/prints/${product.slug}`} className="block w-full text-left">
      <div className="bg-surface border border-hairline p-2.5 shadow-[0_22px_44px_-32px_rgba(28,25,21,0.45)]">
        <div className="relative w-full bg-image-placeholder" style={{ aspectRatio: ratioFor(product) }}>
          {image && (
            <Image
              src={image.url}
              alt={image.alt || product.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
          )}
        </div>
      </div>
      <div className="flex justify-between items-baseline gap-3 mt-4.5 px-0.5">
        <span className="font-display text-xl font-medium">{product.title}</span>
        <span className="text-[12.5px] text-muted whitespace-nowrap">
          From {formatPaise(fromPrice)}
        </span>
      </div>
      {(place || year) && (
        <div className="font-display italic text-[14.5px] text-muted text-left px-0.5 mt-0.5">
          {place}
          {place && year ? ", " : ""}
          {year}
        </div>
      )}
    </Link>
  );
}
