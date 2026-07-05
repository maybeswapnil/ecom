import { CartPageContent } from "@/components/store/CartPageContent";

export const metadata = {
  title: "Your Cart",
};

export default function CartPage() {
  return (
    <section className="max-w-[720px] mx-auto px-7 py-16">
      <h1 className="font-display font-medium text-[clamp(34px,4vw,46px)] m-0 mb-11 tracking-[-0.01em]">
        Cart
      </h1>
      <CartPageContent />
    </section>
  );
}
