import { CheckoutForm } from "@/components/store/CheckoutForm";

export const metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <section className="max-w-[1060px] mx-auto px-7 py-17.5 pb-25">
      <h1 className="font-display font-medium text-[clamp(34px,4vw,46px)] m-0 mb-11 tracking-[-0.01em]">
        Checkout
      </h1>
      <CheckoutForm />
    </section>
  );
}
