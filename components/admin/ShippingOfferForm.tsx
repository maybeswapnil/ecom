"use client";

import { useActionState } from "react";
import {
  updateShippingOffer,
  type UpdateShippingOfferState,
} from "@/lib/admin/offer-actions";
import type { AdminShippingOffer } from "@/lib/offers";

const initialState: UpdateShippingOfferState = {};

const LOW_THRESHOLD_CONFIRM_RUPEES = 1000;

export function ShippingOfferForm({
  offer,
  shippingFlatPaise,
}: {
  offer: AdminShippingOffer;
  shippingFlatPaise: number;
}) {
  const [state, formAction, pending] = useActionState(updateShippingOffer, initialState);

  function guardLowThreshold(e: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(e.currentTarget);
    const threshold = Number(data.get("thresholdRupees"));
    const active = data.get("active") === "on";
    if (
      active &&
      Number.isFinite(threshold) &&
      threshold < LOW_THRESHOLD_CONFIRM_RUPEES &&
      !window.confirm(
        `Threshold is only ₹${threshold} — nearly every order will ship free. Save anyway?`
      )
    ) {
      e.preventDefault();
    }
  }

  return (
    <form action={formAction} onSubmit={guardLowThreshold} className="flex flex-col gap-4">
      <label className="flex items-center gap-2.5 text-sm font-medium text-ink cursor-pointer">
        <input
          type="checkbox"
          name="active"
          defaultChecked={offer.active}
          className="w-4 h-4 accent-ink"
        />
        Offer is active
      </label>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-[13px] font-medium text-ink">
          Offer name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={offer.name}
          className="h-10 px-3 bg-paper border border-border-input rounded-md text-sm"
        />
        {state.fieldErrors?.name && (
          <div className="text-[12.5px] text-red-700">{state.fieldErrors.name}</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="thresholdRupees" className="text-[13px] font-medium text-ink">
            Free shipping over (₹)
          </label>
          <input
            id="thresholdRupees"
            name="thresholdRupees"
            type="number"
            min={0}
            step={1}
            defaultValue={Math.round(offer.minSubtotalPaise / 100)}
            className="h-10 px-3 bg-paper border border-border-input rounded-md text-sm"
          />
          {state.fieldErrors?.thresholdRupees && (
            <div className="text-[12.5px] text-red-700">{state.fieldErrors.thresholdRupees}</div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="flatRateRupees" className="text-[13px] font-medium text-ink">
            Flat shipping rate (₹)
          </label>
          <input
            id="flatRateRupees"
            name="flatRateRupees"
            type="number"
            min={0}
            step={1}
            defaultValue={Math.round(shippingFlatPaise / 100)}
            className="h-10 px-3 bg-paper border border-border-input rounded-md text-sm"
          />
          {state.fieldErrors?.flatRateRupees && (
            <div className="text-[12.5px] text-red-700">{state.fieldErrors.flatRateRupees}</div>
          )}
        </div>
      </div>

      {state.error && <div className="text-[12.5px] text-red-700">{state.error}</div>}
      {state.success && (
        <div className="text-[12.5px] text-green-800">
          Offer saved. Storefront picks it up within a minute.
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-10 px-4 bg-ink text-paper rounded-md text-sm font-medium self-start disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save offer"}
      </button>
    </form>
  );
}
