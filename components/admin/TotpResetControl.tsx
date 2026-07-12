"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function TotpResetControl() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [factorId, setFactorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data, error: listError }) => {
      if (listError) {
        setError("Could not load your authenticator status.");
        setLoading(false);
        return;
      }
      const verified = data?.all.find((f) => f.factor_type === "totp" && f.status === "verified");
      setFactorId(verified?.id ?? null);
      setLoading(false);
    });
  }, [supabase]);

  async function handleReset() {
    if (!factorId) return;
    setError(null);
    setResetting(true);

    const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId });
    if (unenrollError) {
      setError("Could not reset your authenticator — please try again.");
      setResetting(false);
      return;
    }

    // Sign out entirely — a bare AAL1 session would otherwise be routed
    // straight back into re-enrollment on the current page, which is
    // confusing without a fresh sign-in.
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  if (loading) return null;

  return (
    <div className="max-w-xl border border-hairline rounded-xl bg-surface p-6 mt-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-faint mb-1">
        Authenticator app
      </h2>
      <p className="text-sm text-muted mb-5">
        Reset this if your authenticator app shows the wrong label, or if you&rsquo;ve lost access
        to it. You&rsquo;ll be signed out and asked to set it up again on your next login.
      </p>
      {factorId ? (
        <>
          {error && <div className="text-[13px] text-red-700 mb-3">{error}</div>}
          <button
            onClick={handleReset}
            disabled={resetting}
            className="h-11 px-5 bg-transparent border border-border-input rounded-md font-body font-medium text-sm disabled:opacity-50"
          >
            {resetting ? "Resetting…" : "Reset authenticator"}
          </button>
        </>
      ) : (
        <div className="text-sm text-faint italic">No authenticator currently enrolled.</div>
      )}
    </div>
  );
}
