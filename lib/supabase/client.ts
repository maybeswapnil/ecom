import { createBrowserClient } from "@supabase/ssr";

// Anon-key client for browser use (admin login form only — storefront has no client-side DB access).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
