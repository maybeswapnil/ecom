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
  const forwardedFor = req.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() ?? "unknown";
}
