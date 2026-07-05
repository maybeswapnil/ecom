"use client";

import { useActionState } from "react";
import { replyToMessage, type ReplyToMessageState } from "@/lib/admin/message-actions";

const initialState: ReplyToMessageState = {};

export function MessageReplyForm({
  id,
  repliedAt,
  replyBody,
}: {
  id: string;
  repliedAt: string | null;
  replyBody: string | null;
}) {
  const action = replyToMessage.bind(null, id);
  const [state, formAction, pending] = useActionState(action, initialState);

  if (repliedAt && !state.success) {
    return (
      <div className="mt-3 pl-3.5 border-l-2 border-hairline">
        <div className="text-[11px] uppercase tracking-[0.08em] text-faint mb-1">
          Replied {new Date(repliedAt).toLocaleString("en-IN")}
        </div>
        <p className="text-sm text-muted whitespace-pre-line m-0">{replyBody}</p>
      </div>
    );
  }

  if (state.success) {
    return <div className="mt-3 text-sm text-green-800">Reply sent.</div>;
  }

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-2">
      <textarea
        name="reply"
        rows={3}
        placeholder="Write a reply…"
        className="px-3 py-2.5 bg-paper border border-border-input rounded-md text-sm resize-y"
        maxLength={4000}
      />
      {state.error && <div className="text-[12.5px] text-red-700">{state.error}</div>}
      <button
        type="submit"
        disabled={pending}
        className="self-start h-9 px-4 bg-ink text-paper rounded-md text-xs font-medium hover:bg-ink-soft disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send reply"}
      </button>
    </form>
  );
}
