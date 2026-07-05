"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError("Invalid email or password.");
      setSubmitting(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-6">
      <div className="w-full max-w-[380px]">
        <div className="font-display text-2xl font-medium text-center mb-8">Print Company</div>
        <form
          onSubmit={handleSubmit}
          className="border border-hairline bg-surface rounded-xl p-7 flex flex-col gap-4"
        >
          <div className="text-sm font-medium text-ink mb-1">Admin sign in</div>
          <label className="block">
            <span className="text-[11px] tracking-[0.1em] uppercase text-faint block mb-1.5">
              Email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-3.5 border border-border-input bg-paper rounded-md font-body text-[15px] text-ink focus:outline-none focus:border-ink"
            />
          </label>
          <label className="block">
            <span className="text-[11px] tracking-[0.1em] uppercase text-faint block mb-1.5">
              Password
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 px-3.5 border border-border-input bg-paper rounded-md font-body text-[15px] text-ink focus:outline-none focus:border-ink"
            />
          </label>
          {error && <div className="text-[13px] text-red-700">{error}</div>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 mt-2 bg-ink text-paper rounded-md font-body font-medium text-[15px] cursor-pointer disabled:opacity-60 hover:bg-ink-soft"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
