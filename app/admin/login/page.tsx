"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BRAND_NAME } from "@/lib/config";

// Admin login is password + TOTP (authenticator app). The server gates
// (proxy + requireAdmin) only accept AAL2 sessions, so this page must get the
// user through the code step — password alone opens nothing.
type Step = "password" | "enroll" | "code";

const inputClass =
  "w-full h-12 px-3.5 border border-border-input bg-paper rounded-md font-body text-[15px] text-ink focus:outline-none focus:border-ink";
const labelClass = "text-[11px] tracking-[0.1em] uppercase text-faint block mb-1.5";

export default function AdminLoginPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [step, setStep] = useState<Step>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /** Route an authenticated (AAL1) session to the right MFA step. */
  async function continueToMfa(): Promise<boolean> {
    const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
    if (listError || !factors) {
      setError("Could not load MFA settings — please try again.");
      return false;
    }

    const verified = factors.all.filter(
      (f) => f.factor_type === "totp" && f.status === "verified"
    );
    if (verified.length > 0) {
      setFactorId(verified[0].id);
      setStep("code");
      return true;
    }

    // Abandoned enrollments leave unverified factors behind that block
    // re-enrolling under the same name — clear them first.
    for (const stale of factors.all.filter((f) => f.status === "unverified")) {
      await supabase.auth.mfa.unenroll({ factorId: stale.id });
    }

    const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Admin authenticator",
    });
    if (enrollError || !enrolled) {
      setError("Could not start authenticator setup — please try again.");
      return false;
    }

    setFactorId(enrolled.id);
    setQrCode(enrolled.totp.qr_code);
    setTotpSecret(enrolled.totp.secret);
    setStep("enroll");
    return true;
  }

  // A password-only (AAL1) session bounced back here by the server gates
  // shouldn't have to re-enter the password — resume at the MFA step.
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel === "aal2") {
        router.push("/admin");
        return;
      }
      await continueToMfa();
    });
    // Run once on mount against the initial cookie session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError("Invalid email or password.");
      setSubmitting(false);
      return;
    }

    await continueToMfa();
    setSubmitting(false);
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setError(null);
    setSubmitting(true);

    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: code.trim(),
    });
    if (verifyError) {
      setError("That code didn't match — check your authenticator app and try again.");
      setSubmitting(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  const codeInput = (
    <label className="block">
      <span className={labelClass}>6-digit code</span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        required
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className={`${inputClass} tracking-[0.3em] text-center`}
      />
    </label>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-6">
      <div className="w-full max-w-[380px]">
        <div className="font-display text-2xl font-medium text-center mb-8">{BRAND_NAME}</div>

        {step === "password" && (
          <form
            onSubmit={handlePasswordSubmit}
            className="border border-hairline bg-surface rounded-xl p-7 flex flex-col gap-4"
          >
            <div className="text-sm font-medium text-ink mb-1">Admin sign in</div>
            <label className="block">
              <span className={labelClass}>Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Password</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </label>
            {error && <div className="text-[13px] text-red-700">{error}</div>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 mt-2 bg-ink text-paper rounded-md font-body font-medium text-[15px] cursor-pointer disabled:opacity-60 hover:bg-ink-soft"
            >
              {submitting ? "Signing in…" : "Continue"}
            </button>
          </form>
        )}

        {step === "enroll" && (
          <form
            onSubmit={handleCodeSubmit}
            className="border border-hairline bg-surface rounded-xl p-7 flex flex-col gap-4"
          >
            <div className="text-sm font-medium text-ink mb-1">Set up two-factor auth</div>
            <div className="text-[13px] text-muted leading-relaxed">
              Scan this QR code with an authenticator app (Google Authenticator, 1Password,
              Authy…), then enter the 6-digit code it shows. You&rsquo;ll need a code on every
              sign-in from now on.
            </div>
            {qrCode && (
              <div className="bg-white p-3 rounded-md self-center">
                {/* Supabase returns the QR as a data: URI SVG — next/image can't optimize those. */}
                <Image src={qrCode} alt="TOTP enrollment QR code" width={176} height={176} unoptimized />
              </div>
            )}
            {totpSecret && (
              <div className="text-[11.5px] text-faint text-center break-all">
                Can&rsquo;t scan? Enter this key manually: <span className="font-mono">{totpSecret}</span>
              </div>
            )}
            {codeInput}
            {error && <div className="text-[13px] text-red-700">{error}</div>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 mt-2 bg-ink text-paper rounded-md font-body font-medium text-[15px] cursor-pointer disabled:opacity-60 hover:bg-ink-soft"
            >
              {submitting ? "Verifying…" : "Verify & finish setup"}
            </button>
          </form>
        )}

        {step === "code" && (
          <form
            onSubmit={handleCodeSubmit}
            className="border border-hairline bg-surface rounded-xl p-7 flex flex-col gap-4"
          >
            <div className="text-sm font-medium text-ink mb-1">Two-factor code</div>
            <div className="text-[13px] text-muted leading-relaxed">
              Enter the 6-digit code from your authenticator app.
            </div>
            {codeInput}
            {error && <div className="text-[13px] text-red-700">{error}</div>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 mt-2 bg-ink text-paper rounded-md font-body font-medium text-[15px] cursor-pointer disabled:opacity-60 hover:bg-ink-soft"
            >
              {submitting ? "Verifying…" : "Sign in"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
