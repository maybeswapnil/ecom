import { NextResponse } from "next/server";
import { getShippingOfferSummary } from "@/lib/offers";

export const runtime = "nodejs";

/** Public, cacheable summary of the current shipping offer for storefront display.
 *  Prices are always re-derived server-side at checkout — this endpoint is display-only. */
export async function GET() {
  const summary = await getShippingOfferSummary();
  return NextResponse.json(
    {
      free_ship_threshold_paise: summary.freeShipThresholdPaise,
      shipping_flat_paise: summary.shippingFlatPaise,
    },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
