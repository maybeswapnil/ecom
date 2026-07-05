import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "About",
  description: "The story behind Print Company — a decade of photographs from across India.",
};

export default function AboutPage() {
  return (
    <section className="max-w-[1100px] mx-auto px-7 py-20 pb-27.5">
      <div className="mb-16">
        <div className="text-[11px] tracking-[0.32em] uppercase text-muted font-medium mb-5.5">
          About
        </div>
        <h1 className="font-display font-medium text-[clamp(40px,5.4vw,68px)] m-0 max-w-[18ch] leading-[1.08] tracking-[-0.01em]">
          A decade of wandering, one wall at a time.
        </h1>
      </div>
      <div className="flex flex-col md:flex-row gap-10 md:gap-20 items-start">
        <div className="flex-none w-[70%] md:w-[320px] mx-auto md:mx-0">
          <div className="md:sticky md:top-[104px]">
            <div className="relative w-full aspect-[4/5]">
              <Image
                src="/images/about-portrait.png"
                alt="Holding a freshly printed photograph of a Paris street corner"
                fill
                sizes="320px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
        <div className="flex-1 max-w-[600px]">
          <p className="font-display text-2xl leading-[1.5] m-0 mb-6.5 text-ink">
            Print Company started with a single photograph on a friend&rsquo;s wall. She&rsquo;d
            asked for a copy of a picture I&rsquo;d taken years earlier in Varanasi — an alley, a
            figure, a shaft of light.
          </p>
          <p className="text-base leading-[1.75] text-muted-soft m-0 mb-5.5">
            When I finally saw it printed and framed, it looked nothing like the file on my
            laptop. It looked like it belonged there.
          </p>
          <p className="text-base leading-[1.75] text-muted-soft m-0 mb-5.5">
            So this is the collection: photographs I&rsquo;ve made across India over the last
            decade, printed and framed the way I wish someone had framed them for me. Cotton rag
            paper with pigment inks. Solid wood frames. Acrylic glazing so nothing shatters in
            transit. Every piece signed, numbered, and shipped from Bengaluru.
          </p>
          <p className="text-base leading-[1.75] text-muted-soft m-0 mb-7">
            If you have a question about a print, a wall, or a size — write to me at{" "}
            <span className="border-b border-border-input">info@swapnilsharma.in</span>. I answer
            everything myself.
          </p>
          <div className="font-display italic text-2xl text-ink mb-10">— Swapnil Sharma</div>
          <Link
            href="/prints"
            className="inline-flex h-13 px-7 items-center bg-ink text-paper rounded-md font-body font-medium text-[14.5px] hover:bg-ink-soft"
          >
            Browse the collection →
          </Link>
        </div>
      </div>
    </section>
  );
}
