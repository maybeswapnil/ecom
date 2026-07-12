"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { shippingOfferSchema, type ShippingOfferErrors } from "@/lib/validation";

export type UpdateShippingOfferState = {
  error?: string;
  fieldErrors?: ShippingOfferErrors;
  success?: boolean;
};

export async function updateShippingOffer(
  _prev: UpdateShippingOfferState,
  formData: FormData
): Promise<UpdateShippingOfferState> {
  const { email } = await requireAdmin();

  const parsed = shippingOfferSchema.safeParse({
    active: formData.get("active") === "on",
    name: formData.get("name"),
    thresholdRupees: formData.get("thresholdRupees"),
    flatRateRupees: formData.get("flatRateRupees"),
  });

  if (!parsed.success) {
    const fieldErrors: ShippingOfferErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof ShippingOfferErrors;
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { error: settingsError } = await supabase
    .from("company_settings")
    .update({ shipping_flat_paise: parsed.data.flatRateRupees * 100, updated_at: now })
    .eq("id", 1);
  if (settingsError) {
    return { error: "Failed to save the shipping rate. Please try again." };
  }

  const { data: existing } = await supabase
    .from("offers")
    .select("id")
    .eq("type", "free_shipping")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const row = {
    name: parsed.data.name,
    active: parsed.data.active,
    min_subtotal_paise: parsed.data.thresholdRupees * 100,
    updated_by: email,
    updated_at: now,
  };

  const { error: offerError } = existing
    ? await supabase.from("offers").update(row).eq("id", existing.id)
    : await supabase.from("offers").insert({ type: "free_shipping", ...row });

  if (offerError) {
    return { error: "Failed to save the offer. Please try again." };
  }

  revalidatePath("/admin/offers");
  return { success: true };
}
