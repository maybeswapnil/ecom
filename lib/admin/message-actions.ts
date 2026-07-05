"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendContactReplyEmail } from "@/lib/email/send";
import { contactReplySchema } from "@/lib/validation";

export async function markMessageRead(id: string, isRead: boolean) {
  await requireAdmin();
  const supabase = createAdminClient();

  await supabase.from("contact_messages").update({ is_read: isRead }).eq("id", id);
  revalidatePath("/admin/messages");
}

export type ReplyToMessageState = { error?: string; success?: boolean };

export async function replyToMessage(
  id: string,
  _prev: ReplyToMessageState,
  formData: FormData
): Promise<ReplyToMessageState> {
  await requireAdmin();

  const parsed = contactReplySchema.safeParse({ reply: formData.get("reply") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid reply" };
  }

  const supabase = createAdminClient();
  const { data: message } = await supabase
    .from("contact_messages")
    .select("name, email, message")
    .eq("id", id)
    .maybeSingle();

  if (!message) return { error: "Message not found." };

  const result = await sendContactReplyEmail({
    to: message.email,
    name: message.name,
    originalMessage: message.message,
    replyBody: parsed.data.reply,
  });

  if (!result.sent) {
    return { error: `Failed to send reply: ${result.reason}` };
  }

  await supabase
    .from("contact_messages")
    .update({ reply_body: parsed.data.reply, replied_at: new Date().toISOString(), is_read: true })
    .eq("id", id);

  revalidatePath("/admin/messages");
  return { success: true };
}
