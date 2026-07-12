"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024;
const HERO_STORAGE_PREFIX = "site/";

function heroStoragePath(url: string): string | null {
  const path = url.split("/product-images/")[1];
  return path?.startsWith(HERO_STORAGE_PREFIX) ? path : null;
}

async function currentHeroUrl(supabase: ReturnType<typeof createAdminClient>): Promise<string> {
  const { data } = await supabase
    .from("company_settings")
    .select("hero_image_url")
    .eq("id", 1)
    .maybeSingle();
  return data?.hero_image_url ?? "";
}

async function saveHeroUrl(
  supabase: ReturnType<typeof createAdminClient>,
  url: string
): Promise<string | null> {
  const { error } = await supabase
    .from("company_settings")
    .update({ hero_image_url: url, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) return error.message;

  revalidatePath("/");
  revalidatePath("/admin/settings");
  return null;
}

/** Upload a (client-side cropped) hero image and make it live on the home page. */
export async function updateHeroImage(formData: FormData) {
  await requireAdmin();

  const file = formData.get("file") as File | null;
  if (!file) return { error: "No file provided." };
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return { error: "Only JPG, PNG, or WebP images are allowed." };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { error: "Image must be 4MB or smaller." };
  }

  const supabase = createAdminClient();
  const ext = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
  const path = `${HERO_STORAGE_PREFIX}hero-${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { error: uploadError.message };

  const previousUrl = await currentHeroUrl(supabase);

  const {
    data: { publicUrl },
  } = supabase.storage.from("product-images").getPublicUrl(path);

  const saveError = await saveHeroUrl(supabase, publicUrl);
  if (saveError) return { error: "Failed to save hero image. Please try again." };

  // Best-effort cleanup of the replaced upload — only files we own under site/.
  const previousPath = heroStoragePath(previousUrl);
  if (previousPath) {
    await supabase.storage.from("product-images").remove([previousPath]);
  }

  return { ok: true, url: publicUrl };
}

/** Set (or clear, with null) the product the home-page hero links to. */
export async function updateHeroProduct(productId: string | null) {
  await requireAdmin();

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("company_settings")
    .update({ hero_product_id: productId, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) return { error: "Failed to save hero link. Please try again." };

  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { ok: true };
}

/** Revert the home page to the bundled default hero image. */
export async function resetHeroImage() {
  await requireAdmin();

  const supabase = createAdminClient();
  const previousUrl = await currentHeroUrl(supabase);

  const saveError = await saveHeroUrl(supabase, "");
  if (saveError) return { error: "Failed to reset hero image. Please try again." };

  const previousPath = heroStoragePath(previousUrl);
  if (previousPath) {
    await supabase.storage.from("product-images").remove([previousPath]);
  }

  return { ok: true };
}
