"use client";

import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { CartDrawer } from "@/components/store/CartDrawer";
import { useCartUiStore } from "@/lib/cart-ui-store";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const open = useCartUiStore((s) => s.open);
  const setOpen = useCartUiStore((s) => s.setOpen);

  return (
    <>
      <Header onCartOpen={() => setOpen(true)} />
      <main className="flex-1 pc-fade-in">{children}</main>
      <Footer />
      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
