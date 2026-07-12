import { createAdminClient } from "@/lib/supabase/admin";
import { BRAND_NAME } from "@/lib/config";

export type CompanySettings = {
  companyName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  supportEmail: string;
  supportPhone: string;
};

const FALLBACK: CompanySettings = {
  companyName: BRAND_NAME,
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  supportEmail: "info@printscompany.in",
  supportPhone: "",
};

export function companySettingsAddressLines(settings: CompanySettings): string[] {
  const cityLine = [settings.city, settings.state, settings.pincode].filter(Boolean).join(", ");
  return [settings.addressLine1, settings.addressLine2, cityLine].filter(Boolean);
}

/** Home-page hero image URL — empty string means "use the bundled default".
 *  Kept separate from getCompanySettings so a failure here (e.g. migration not
 *  yet applied) can't degrade the invoice/email company details. */
export async function getHeroImageUrl(): Promise<string> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("company_settings")
    .select("hero_image_url")
    .eq("id", 1)
    .maybeSingle();

  return data?.hero_image_url ?? "";
}

export async function getCompanySettings(): Promise<CompanySettings> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("company_settings")
    .select(
      "company_name, address_line1, address_line2, city, state, pincode, support_email, support_phone"
    )
    .eq("id", 1)
    .maybeSingle();

  if (!data) return FALLBACK;

  return {
    companyName: data.company_name || FALLBACK.companyName,
    addressLine1: data.address_line1,
    addressLine2: data.address_line2,
    city: data.city,
    state: data.state,
    pincode: data.pincode,
    supportEmail: data.support_email || FALLBACK.supportEmail,
    supportPhone: data.support_phone,
  };
}
