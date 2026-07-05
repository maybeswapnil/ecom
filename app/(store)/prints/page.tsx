import { getLiveProducts } from "@/lib/catalog";
import { PrintsGrid, type GridCard } from "@/components/store/PrintsGrid";
import { ProductCard } from "@/components/store/ProductCard";

export const metadata = {
  title: "All Prints",
  description: "Browse the full collection of limited-edition framed photographic prints.",
};

export default async function PrintsPage() {
  const products = await getLiveProducts();
  const cards: GridCard[] = products.map((p) => ({
    id: p.id,
    tags: p.tags,
    node: <ProductCard product={p} />,
  }));

  return (
    <section className="max-w-[1320px] mx-auto px-7 pt-20 pb-15">
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
