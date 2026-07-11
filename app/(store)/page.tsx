import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getFeaturedProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/store/ProductCard";
import { BRAND_NAME, SITE_URL, SOCIAL_LINKS } from "@/lib/config";

const HOME_DESCRIPTION =
  "A small collection of limited-edition framed photographic prints from a decade spent wandering India. Archival paper, hand-framed, shipped ready to hang.";

export const metadata: Metadata = {
  title: `${BRAND_NAME} — Framed Photographic Prints`,
  description: HOME_DESCRIPTION,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: `${BRAND_NAME} — Framed Photographic Prints`,
    description: HOME_DESCRIPTION,
    url: SITE_URL,
    siteName: BRAND_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_NAME} — Framed Photographic Prints`,
    description: HOME_DESCRIPTION,
  },
};

export default async function HomePage() {
  const featured = await getFeaturedProducts();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: BRAND_NAME,
      url: SITE_URL,
      email: "info@printscompany.in",
      sameAs: [SOCIAL_LINKS.instagram, SOCIAL_LINKS.pexels],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: BRAND_NAME,
      url: SITE_URL,
    },
  ];

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero */}
      <div className="max-w-[1000px] mx-auto px-7 py-13 md:py-[90px] md:pb-10 flex flex-col md:flex-row gap-12 md:gap-16 items-center justify-center md:min-h-[72vh]">
        <div className="flex-[1_1_50%] max-w-[440px]">
          <div className="text-[11px] tracking-[0.32em] uppercase text-muted font-medium mb-7.5">
            {BRAND_NAME} · Est. 2026
          </div>
          <h1 className="font-display font-medium text-[clamp(46px,5.6vw,80px)] leading-[1.04] tracking-[-0.01em] mb-6.5">
            Photographs,
            <br />
            framed with <span className="font-semibold">care.</span>
          </h1>
          <p className="text-[17px] leading-[1.65] text-muted-soft max-w-[44ch] mb-9.5">
            A small collection of limited-edition prints from a decade spent wandering India — each
            printed on archival paper, framed by hand, and shipped ready to hang.
          </p>
          <div className="flex flex-wrap gap-3.5 items-center">
            <Link
              href="/prints"
              className="h-[54px] px-7.5 bg-ink text-paper rounded-md font-body font-medium text-[15px] flex items-center gap-2.5 hover:bg-ink-soft"
            >
              Browse the collection <span className="text-base">→</span>
            </Link>
            <Link
              href="/about"
              className="h-[54px] px-5.5 bg-transparent text-ink font-body font-medium text-[15px] flex items-center hover:opacity-60"
            >
              The story
            </Link>
          </div>
        </div>
        <div className="flex-[1_1_44%] w-full max-w-[440px]">
          <div className="relative w-full aspect-[4/5] bg-image-placeholder shadow-[0_30px_60px_-38px_rgba(28,25,21,0.5)]">
            <Image
              src="/images/hero-framed-print.jpg"
              alt="A framed print of a mountain range, held up in a sunlit room"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 440px"
              className="object-cover object-bottom"
            />
          </div>
          <div className="flex justify-between items-baseline mt-4.5 px-0.5">
            <span className="font-display italic text-base text-muted">
              Framed and ready to hang
            </span>
            <span className="text-[11px] tracking-[0.18em] uppercase text-faint">
              Edition of 50
            </span>
          </div>
        </div>
      </div>

      {/* Featured */}
      <div className="max-w-[1320px] mx-auto px-7 pt-[110px] pb-10">
        <div className="flex items-baseline justify-between gap-5 border-t border-hairline pt-14 mb-14">
          <h2 className="font-display font-medium text-[clamp(30px,3.4vw,42px)] m-0 tracking-[-0.005em]">
            From the collection
          </h2>
          <Link
            href="/prints"
            className="bg-transparent text-muted text-[13px] tracking-[0.14em] uppercase whitespace-nowrap hover:text-ink"
          >
            All prints →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-13 md:gap-11">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>

      {/* Trust row */}
      <div className="max-w-[1320px] mx-auto px-7 py-17.5">
        <div className="flex flex-wrap gap-5 justify-between border-t border-b border-hairline py-8.5">
          {[
            { title: "Secure payment", body: "Razorpay — UPI, cards & netbanking." },
            { title: "Insured shipping", body: "Packed flat, couriered across India." },
            { title: "14-day returns", body: "Not right on the wall? Send it back." },
          ].map((t) => (
            <div key={t.title} className="flex-1 min-w-[200px] text-center px-4 py-2.5">
              <div className="text-[11px] tracking-[0.22em] uppercase font-semibold mb-1.5">
                {t.title}
              </div>
              <div className="text-[13px] text-muted leading-relaxed">{t.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Story teaser */}
      <div className="max-w-[1320px] mx-auto px-7 pt-15 pb-[130px]">
        <div className="flex flex-col md:flex-row gap-10 md:gap-[90px] items-center justify-center">
          <div className="flex-none w-[70%] md:w-[300px] max-w-[300px]">
            <div className="relative w-full aspect-[4/5] bg-image-placeholder">
              <Image
                src="/images/about-portrait.png"
                alt="Holding a freshly printed photograph of a Paris street corner"
                fill
                sizes="300px"
                className="object-cover"
              />
            </div>
          </div>
          <div className="flex-1 max-w-[620px]">
            <div className="text-[11px] tracking-[0.32em] uppercase text-muted font-medium mb-6.5">
              The story
            </div>
            <p className="font-display italic font-normal text-[clamp(26px,3vw,36px)] leading-[1.35] text-ink mb-7">
              &ldquo;When I finally saw it printed and framed, it looked nothing like the file on my
              laptop. It looked like it belonged there.&rdquo;
            </p>
            <p className="text-[15.5px] leading-[1.7] text-muted-soft mb-8.5 max-w-[52ch]">
              {`${BRAND_NAME} began with a single photograph on a friend’s wall — and became a decade of images from across India, printed and framed the way they deserve.`}
            </p>
            <Link
              href="/about"
              className="h-[50px] px-6.5 bg-transparent text-ink border border-ink rounded-md font-body font-medium text-sm inline-flex items-center hover:bg-ink hover:text-paper"
            >
              Read the story
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
