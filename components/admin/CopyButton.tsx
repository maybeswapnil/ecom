"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={handleCopy}
      className="text-xs text-muted hover:text-ink bg-transparent border-none cursor-pointer"
    >
      {copied ? "Copied ✓" : "Copy for courier"}
    </button>
  );
}
