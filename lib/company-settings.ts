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

export type HeroSettings = {
  /** Empty string means "use the bundled default image". */
  imageUrl: string;
  productId: string | null;
  /** Slug to link the hero to — null when unset or the product isn't live. */
  productSlug: string | null;
};

/** Home-page hero image + optional product link. Kept separate from
 *  getCompanySettings so a failure here (e.g. migration not yet applied)
 *  can't degrade the invoice/email company details. */
export async function getHeroSettings(): Promise<HeroSettings> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("company_settings")
    .select("hero_image_url, hero_product_id, hero_product:products(slug, status)")
    .eq("id", 1)
    .maybeSingle();

  const product = (data?.hero_product as unknown as { slug: string; status: string } | null) ?? null;
  return {
    imageUrl: data?.hero_image_url ?? "",
    productId: data?.hero_product_id ?? null,
    // Only link to live products — a draft/archived target would 404 for shoppers.
    productSlug: product && product.status === "live" ? product.slug : null,
  };
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
