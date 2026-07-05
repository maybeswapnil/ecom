"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function markMessageRead(id: string, isRead: boolean) {
  await requireAdmin();
  const supabase = createAdminClient();

  await supabase.from("contact_messages").update({ is_read: isRead }).eq("id", id);
  revalidatePath("/admin/messages");
}
