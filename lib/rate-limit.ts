import { createAdminClient } from "@/lib/supabase/admin";

export async function checkRateLimit(
  key: string,
  max: number,
  windowSecs: number
): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: key,
    p_max: max,
    p_window_secs: windowSecs,
  });
  if (error) {
    // Fail open — rate limiting must never block checkout because of an infra hiccup.
    return true;
  }
  return Boolean(data);
}

export function clientIp(req: Request): string {
  // x-real-ip is set by the platform proxy (Vercel) and cannot be spoofed by the client.
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  // In x-forwarded-for the FIRST entries are client-supplied (an attacker can send their own
  // header and the proxy appends to it), so take the LAST hop — the one the trusted proxy added.
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const hops = forwardedFor.split(",");
    const lastHop = hops[hops.length - 1]?.trim();
    if (lastHop) return lastHop;
  }
  return "unknown";
}
