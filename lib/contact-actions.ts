"use server";

import { createClient } from "@/lib/supabase/server";
import { contactFormSchema, type ContactFormErrors } from "@/lib/validation";

export type ContactFormState = {
  error?: string;
  fieldErrors?: ContactFormErrors;
  success?: boolean;
};

export async function submitContactMessage(
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const parsed = contactFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    const fieldErrors: ContactFormErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof ContactFormErrors;
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    message: parsed.data.message,
  });

  if (error) {
    return { error: "Something went wrong sending your message. Please try again." };
  }

  return { success: true };
}
