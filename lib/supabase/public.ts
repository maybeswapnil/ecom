import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cookie-less anon client for public catalog/review reads. The cookie-bound
// client in server.ts calls next/headers cookies(), which opts every page that
// uses it out of static rendering — catalog data is anon-readable and doesn't
// need a session, so storefront reads must go through this client to stay
// cacheable (ISR).
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
