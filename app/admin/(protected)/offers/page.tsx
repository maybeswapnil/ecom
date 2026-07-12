import { getShippingOfferForAdmin } from "@/lib/offers";
import { ShippingOfferForm } from "@/components/admin/ShippingOfferForm";

export const dynamic = "force-dynamic";

export default async function AdminOffersPage() {
  const { offer, shippingFlatPaise } = await getShippingOfferForAdmin();

  return (
    <div>
      <h1 className="font-display text-3xl font-medium mb-6">Offers</h1>
      <div className="max-w-xl border border-hairline rounded-xl bg-surface p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-faint mb-1">
          Free shipping
        </h2>
        <p className="text-sm text-muted mb-5">
          Orders at or above the threshold ship free; everything below pays the flat rate. Applied
          server-side at checkout — the storefront banner, progress bar and totals all follow this
          rule automatically.
        </p>
        <ShippingOfferForm offer={offer} shippingFlatPaise={shippingFlatPaise} />
        {offer.updatedAt && (
          <p className="text-xs text-faint mt-4">
            Last changed {new Date(offer.updatedAt).toLocaleString("en-IN")}
            {offer.updatedBy ? ` by ${offer.updatedBy}` : ""}
          </p>
        )}
      </div>
    </div>
  );
}
