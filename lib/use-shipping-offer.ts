"use client";

import { useEffect, useState } from "react";
import { FREE_SHIP_THRESHOLD_PAISE, SHIPPING_FLAT_PAISE } from "@/lib/config";

export type ShippingOffer = {
  /** null = no free-shipping offer currently running. */
  thresholdPaise: number | null;
  flatPaise: number;
};

/** Fetches the live shipping offer once per mount. Returns undefined while loading so
 *  marketing surfaces (drawer strip, progress bar) can hide rather than flash stale copy.
 *  On fetch failure falls back to the compiled defaults — same values the server fails
 *  closed to, so client and server can't disagree. */
export function useShippingOffer(): ShippingOffer | undefined {
  const [offer, setOffer] = useState<ShippingOffer | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/offers/shipping")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setOffer({
          thresholdPaise: data.free_ship_threshold_paise ?? null,
          flatPaise: data.shipping_flat_paise ?? SHIPPING_FLAT_PAISE,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setOffer({ thresholdPaise: FREE_SHIP_THRESHOLD_PAISE, flatPaise: SHIPPING_FLAT_PAISE });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return offer;
}
