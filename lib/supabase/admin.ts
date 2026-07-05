import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS. Server-only code paths (SPEC.md §1.3, §10). Never import from client components.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}
