"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { companySettingsSchema, type CompanySettingsErrors } from "@/lib/validation";

export type UpdateCompanySettingsState = {
  error?: string;
  fieldErrors?: CompanySettingsErrors;
  success?: boolean;
};

export async function updateCompanySettings(
  _prev: UpdateCompanySettingsState,
  formData: FormData
): Promise<UpdateCompanySettingsState> {
  await requireAdmin();

  const parsed = companySettingsSchema.safeParse({
    companyName: formData.get("companyName"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2"),
    city: formData.get("city"),
    state: formData.get("state"),
    pincode: formData.get("pincode"),
    supportEmail: formData.get("supportEmail"),
    supportPhone: formData.get("supportPhone"),
  });

  if (!parsed.success) {
    const fieldErrors: CompanySettingsErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof CompanySettingsErrors;
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("company_settings")
    .update({
      company_name: parsed.data.companyName,
      address_line1: parsed.data.addressLine1,
      address_line2: parsed.data.addressLine2,
      city: parsed.data.city,
      state: parsed.data.state,
      pincode: parsed.data.pincode,
      support_email: parsed.data.supportEmail,
      support_phone: parsed.data.supportPhone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    return { error: "Failed to save settings. Please try again." };
  }

  revalidatePath("/admin/settings");
  return { success: true };
}
