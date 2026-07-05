"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartStore, cartCount } from "@/lib/cart-store";
import { useHydrated } from "@/lib/use-hydrated";
import { BRAND_NAME } from "@/lib/config";
import { CartIcon } from "@/components/ui/icons";

export function Header({ onCartOpen }: { onCartOpen: () => void }) {
  const pathname = usePathname();
  const lines = useCartStore((s) => s.lines);
  const hydrated = useHydrated();
  const count = hydrated ? cartCount(lines) : 0;

  const navLinkClass = (active: boolean) =>
    `inline-flex items-center leading-none pb-1 px-0.5 bg-transparent border-none font-body text-sm font-medium tracking-[0.01em] cursor-pointer border-b ${
      active ? "text-ink border-ink" : "text-muted border-transparent"
    }`;

  return (
    <header className="sticky top-0 z-40 bg-paper/92 backdrop-blur-md border-b border-hairline">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-7 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-5">
        <div className="flex items-center gap-4 sm:gap-9 min-w-0">
          <Link href="/" className="bg-transparent border-none cursor-pointer p-0 shrink-0 flex items-center">
            <span className="font-display text-lg sm:text-[26px] font-medium tracking-[0.01em] text-ink whitespace-nowrap leading-none">
              {BRAND_NAME}
            </span>
          </Link>
          <nav className="flex items-center gap-3 sm:gap-6 shrink-0">
            <Link href="/prints" className={navLinkClass(pathname?.startsWith("/prints") ?? false)}>
              Prints
            </Link>
            <Link href="/about" className={navLinkClass(pathname === "/about")}>
              About
            </Link>
          </nav>
        </div>
        <button
          onClick={onCartOpen}
          aria-label="Cart"
          className="relative flex items-center justify-center w-11 h-11 bg-transparent border-none cursor-pointer text-ink -mr-2 shrink-0 hover:opacity-60"
        >
          <CartIcon />
          {count > 0 && (
            <span className="absolute top-1 right-0.5 min-w-4 h-4 px-1 flex items-center justify-center bg-ink text-paper rounded-full text-[10px] font-semibold">
              {count}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
