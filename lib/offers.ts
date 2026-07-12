import { createAdminClient } from "@/lib/supabase/admin";
import { FREE_SHIP_THRESHOLD_PAISE, SHIPPING_FLAT_PAISE } from "@/lib/config";

export type FreeShippingOffer = {
  id: string;
  min_subtotal_paise: number;
  starts_at: string | null;
  ends_at: string | null;
};

export type ShippingQuote = {
  shippingPaise: number;
  /** null = no free-shipping offer currently running (hide threshold UI entirely). */
  freeShipThresholdPaise: number | null;
  /** Set when the offer zeroed shipping — snapshotted onto the order for audit. */
  appliedOfferId: string | null;
};

/** Pure quote math, separated from data access so it can be unit-tested directly. */
export function computeShippingQuote(
  subtotalPaise: number,
  flatPaise: number,
  offer: FreeShippingOffer | null,
  nowMs: number
): ShippingQuote {
  const withinWindow =
    offer !== null &&
    (!offer.starts_at || new Date(offer.starts_at).getTime() <= nowMs) &&
    (!offer.ends_at || new Date(offer.ends_at).getTime() > nowMs);

  const qualifies = withinWindow && subtotalPaise >= offer.min_subtotal_paise;

  return {
    shippingPaise: qualifies ? 0 : flatPaise,
    freeShipThresholdPaise: withinWindow ? offer.min_subtotal_paise : null,
    appliedOfferId: qualifies ? offer.id : null,
  };
}

/** null on any read error — callers fall back to the compiled defaults. */
async function fetchShippingData(): Promise<{
  flatPaise: number;
  offer: FreeShippingOffer | null;
} | null> {
  const supabase = createAdminClient();

  const [settingsRes, offerRes] = await Promise.all([
    supabase.from("company_settings").select("shipping_flat_paise").eq("id", 1).maybeSingle(),
    supabase
      .from("offers")
      .select("id, min_subtotal_paise, starts_at, ends_at")
      .eq("type", "free_shipping")
      .eq("active", true)
      .maybeSingle(),
  ]);

  if (settingsRes.error || offerRes.error) return null;

  return {
    flatPaise: settingsRes.data?.shipping_flat_paise ?? SHIPPING_FLAT_PAISE,
    offer: offerRes.data ?? null,
  };
}

export async function getShippingQuote(subtotalPaise: number): Promise<ShippingQuote> {
  const data = await fetchShippingData();

  // Fail closed: on a read error fall back to the compiled defaults and CHARGE shipping below
  // the default threshold — an infra hiccup must never make everything ship free.
  if (!data) {
    const fallback = computeShippingQuote(
      subtotalPaise,
      SHIPPING_FLAT_PAISE,
      {
        id: "fallback",
        min_subtotal_paise: FREE_SHIP_THRESHOLD_PAISE,
        starts_at: null,
        ends_at: null,
      },
      Date.now()
    );
    // "fallback" is not a real offers.id — never write it into orders.applied_offer_id.
    return { ...fallback, appliedOfferId: null };
  }

  return computeShippingQuote(subtotalPaise, data.flatPaise, data.offer, Date.now());
}

export type AdminShippingOffer = {
  id: string | null; // null = no row yet (action inserts on first save)
  name: string;
  active: boolean;
  minSubtotalPaise: number;
  updatedBy: string | null;
  updatedAt: string | null;
};

/** Admin view: the raw free-shipping row regardless of active state, plus the flat rate. */
export async function getShippingOfferForAdmin(): Promise<{
  offer: AdminShippingOffer;
  shippingFlatPaise: number;
}> {
  const supabase = createAdminClient();

  const [settingsRes, offerRes] = await Promise.all([
    supabase.from("company_settings").select("shipping_flat_paise").eq("id", 1).maybeSingle(),
    supabase
      .from("offers")
      .select("id, name, active, min_subtotal_paise, updated_by, updated_at")
      .eq("type", "free_shipping")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    shippingFlatPaise: settingsRes.data?.shipping_flat_paise ?? SHIPPING_FLAT_PAISE,
    offer: offerRes.data
      ? {
          id: offerRes.data.id,
          name: offerRes.data.name,
          active: offerRes.data.active,
          minSubtotalPaise: offerRes.data.min_subtotal_paise,
          updatedBy: offerRes.data.updated_by,
          updatedAt: offerRes.data.updated_at,
        }
      : {
          id: null,
          name: "Free insured shipping",
          active: false,
          minSubtotalPaise: FREE_SHIP_THRESHOLD_PAISE,
          updatedBy: null,
          updatedAt: null,
        },
  };
}

/** For display surfaces (cart drawer strip, checkout shipping row) — no subtotal involved. */
export async function getShippingOfferSummary(): Promise<{
  shippingFlatPaise: number;
  freeShipThresholdPaise: number | null;
}> {
  const data = await fetchShippingData();
  if (!data) {
    return {
      shippingFlatPaise: SHIPPING_FLAT_PAISE,
      freeShipThresholdPaise: FREE_SHIP_THRESHOLD_PAISE,
    };
  }
  const quote = computeShippingQuote(0, data.flatPaise, data.offer, Date.now());
  return {
    shippingFlatPaise: data.flatPaise,
    freeShipThresholdPaise: quote.freeShipThresholdPaise,
  };
}
