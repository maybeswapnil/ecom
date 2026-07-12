import type { Metadata } from "next";
import { getLiveProducts } from "@/lib/catalog";
import { PrintsGrid, type GridCard } from "@/components/store/PrintsGrid";
import { ProductCard } from "@/components/store/ProductCard";
import { BRAND_NAME, SITE_URL } from "@/lib/config";

// ISR safety net — admin edits revalidate this path immediately; see home page.
export const revalidate = 300;

const PRINTS_DESCRIPTION =
  "Browse the full collection of limited-edition framed photographic prints, printed on archival paper and framed by hand.";

export const metadata: Metadata = {
  title: "All Prints",
  description: PRINTS_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/prints` },
  openGraph: {
    title: `All Prints | ${BRAND_NAME}`,
    description: PRINTS_DESCRIPTION,
    url: `${SITE_URL}/prints`,
    siteName: BRAND_NAME,
    type: "website",
  },
};

export default async function PrintsPage() {
  const products = await getLiveProducts();
  const cards: GridCard[] = products.map((p) => ({
    id: p.id,
    tags: p.tags,
    node: <ProductCard product={p} />,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Prints", item: `${SITE_URL}/prints` },
    ],
  };

  return (
    <section className="max-w-[1320px] mx-auto px-7 pt-20 pb-15">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mb-13.5">
        <div className="text-[11px] tracking-[0.32em] uppercase text-muted font-medium mb-5">
          The collection
        </div>
        <h1 className="font-display font-medium text-[clamp(40px,5vw,64px)] m-0 mb-8.5 tracking-[-0.01em]">
          All prints
        </h1>
        <PrintsGrid cards={cards} />
      </div>
    </section>
  );
}
