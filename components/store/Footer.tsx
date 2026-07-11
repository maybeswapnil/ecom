import Link from "next/link";
import { BRAND_NAME, SOCIAL_LINKS } from "@/lib/config";

const footerColumns = [
  {
    head: "Shop",
    links: [
      { label: "All prints", href: "/prints" },
      { label: "About", href: "/about" },
    ],
  },
  {
    head: "Help",
    links: [
      { label: "Shipping", href: "/shipping" },
      { label: "Returns", href: "/refunds" },
      { label: "Privacy", href: "/privacy" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

const socialLinks = [
  { label: "Instagram", href: SOCIAL_LINKS.instagram },
  { label: "Pexels", href: SOCIAL_LINKS.pexels },
];

export function Footer() {
  return (
    <footer className="border-t border-hairline">
      <div className="max-w-[1320px] mx-auto px-7 pt-14 pb-12 flex flex-wrap gap-11 justify-between">
        <div className="max-w-[280px]">
          <div className="font-display text-2xl font-medium mb-3">{BRAND_NAME}</div>
          <p className="text-[13px] text-muted leading-relaxed m-0">
            Fine-art photographic prints, framed by hand and shipped insured across India.
          </p>
        </div>
        <div className="flex gap-16 flex-wrap">
          {footerColumns.map((col) => (
            <div key={col.head}>
              <div className="text-[10.5px] tracking-[0.2em] uppercase text-faint font-semibold mb-4">
                {col.head}
              </div>
              <div className="flex flex-col gap-2.5">
                {col.links.map((lk) => (
                  <Link
                    key={lk.href}
                    href={lk.href}
                    className="text-left p-0 font-body text-[13.5px] text-muted-soft hover:text-ink"
                  >
                    {lk.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <div>
            <div className="text-[10.5px] tracking-[0.2em] uppercase text-faint font-semibold mb-4">
              Follow
            </div>
            <div className="flex flex-col gap-2.5">
              {socialLinks.map((lk) => (
                <a
                  key={lk.href}
                  href={lk.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-left p-0 font-body text-[13.5px] text-muted-soft hover:text-ink"
                >
                  {lk.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-[1320px] mx-auto px-7 pb-7 flex flex-wrap gap-2.5 justify-between text-xs text-faint">
        <span>© 2026 {BRAND_NAME} · Made in India</span>
        <span>Payments by Razorpay · Shipping insured</span>
      </div>
    </footer>
  );
}
