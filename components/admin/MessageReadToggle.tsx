"use client";

import { useTransition } from "react";
import { markMessageRead } from "@/lib/admin/message-actions";

export function MessageReadToggle({ id, isRead }: { id: string; isRead: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => markMessageRead(id, !isRead))}
      disabled={pending}
      className="px-2.5 py-1 rounded text-xs font-medium bg-surface-sunken text-muted hover:text-ink disabled:opacity-60"
    >
      {isRead ? "Mark unread" : "Mark read"}
    </button>
  );
}
