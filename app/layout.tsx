import type { Metadata } from "next";
import { displaySerif, bodySans } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Print Company — Framed Photographic Prints",
    template: "%s | Print Company",
  },
  description:
    "Limited-edition photographic prints from across India, printed on archival paper and framed by hand.",
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
