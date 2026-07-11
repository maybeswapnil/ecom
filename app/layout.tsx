import type { Metadata } from "next";
import { displaySerif, bodySans } from "./fonts";
import { BRAND_NAME, SITE_URL } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND_NAME} — Framed Photographic Prints`,
    template: `%s | ${BRAND_NAME}`,
  },
  description:
    "Limited-edition photographic prints from across India, printed on archival paper and framed by hand.",
  openGraph: {
    siteName: BRAND_NAME,
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${displaySerif.variable} ${bodySans.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-paper text-ink font-body overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
