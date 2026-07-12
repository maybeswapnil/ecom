import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

/** Server-side guard for admin pages and server actions. Re-checks the allowlist on every call —
 *  middleware only confirms a session exists, this confirms the session belongs to an admin. */
export async function requireAdmin(): Promise<{ email: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    redirect("/admin/login");
  }

  // Admin sessions must be MFA-verified (AAL2). A password-only session is
  // AAL1 and gets bounced back to the login page, which walks the user through
  // TOTP enrollment (first time) or the 6-digit challenge. Enforcing here —
  // not just in the proxy — covers every server action as well.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") {
    redirect("/admin/login");
  }

  return { email: user.email! };
}
