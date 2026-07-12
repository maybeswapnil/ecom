import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, getLiveSlugs, distinctSizes, sortedVariants } from "@/lib/catalog";
import { getApprovedReviews, aggregateRating } from "@/lib/reviews";
import { ProductView } from "@/components/store/ProductView";
import { ProductReviews } from "@/components/store/ProductReviews";
import { SITE_URL } from "@/lib/config";

// ISR safety net — admin edits revalidate this path immediately; see home page.
export const revalidate = 300;

// Prerender all live products at build; new slugs render on first request and
// are then cached (dynamicParams defaults to true).
export async function generateStaticParams() {
  const slugs = await getLiveSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const sizes = distinctSizes(product);
  const fromPrice = sizes.length ? Math.min(...sizes.map((s) => s.price_paise)) / 100 : 0;
  const title = `${product.title} — Framed Print`;
  const description =
    product.description ??
    `${product.title}, a limited-edition framed photographic print. From ₹${fromPrice.toLocaleString("en-IN")}.`;
  const heroImage = product.images.find((img) => img.role === "framed") ?? product.images[0];

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/prints/${product.slug}` },
    openGraph: {
      title,
      description,
      // Route the OG image through the Next image optimizer — the stored
      // original can be multi-MB, which link-preview crawlers fetch in full.
      // Resolved absolute against metadataBase; w=1200 is a default deviceSize.
      images: heroImage
        ? [`/_next/image?url=${encodeURIComponent(heroImage.url)}&w=1200&q=75`]
        : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const variants = sortedVariants(product);
  const place = product.tags.find((t) => t.startsWith("place:"))?.slice(6) ?? "";
  const year = product.tags.find((t) => t.startsWith("year:"))?.slice(5) ?? "";
  const ratio = product.tags.includes("portrait") ? "4/5" : "3/2";

  const reviews = await getApprovedReviews(product.id);
  const rating = aggregateRating(reviews);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      description: product.description,
      image: product.images.map((img) => img.url),
      sku: variants[0]?.sku,
      ...(rating && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: rating.average.toFixed(1),
          reviewCount: rating.count,
        },
      }),
      ...(reviews.length > 0 && {
        review: reviews.map((r) => ({
          "@type": "Review",
          author: { "@type": "Person", name: r.reviewer_name },
          reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
          ...(r.body && { reviewBody: r.body }),
        })),
      }),
      offers: variants.map((v) => ({
        "@type": "Offer",
        sku: v.sku,
        priceCurrency: "INR",
        price: (v.price_paise / 100).toFixed(2),
        availability:
          v.stock_qty > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url: `${SITE_URL}/prints/${product.slug}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Prints", item: `${SITE_URL}/prints` },
        {
          "@type": "ListItem",
          position: 3,
          name: product.title,
          item: `${SITE_URL}/prints/${product.slug}`,
        },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductView product={product} variants={variants} place={place} year={year} ratio={ratio} />
      <ProductReviews reviews={reviews} average={rating?.average ?? null} />
    </>
  );
}
