"use client";

import { useActionState } from "react";
import { submitContactMessage, type ContactFormState } from "@/lib/contact-actions";

const initialState: ContactFormState = {};

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactMessage, initialState);

  if (state.success) {
    return (
      <div className="mt-8 p-6 bg-surface border border-hairline rounded-xl max-w-[52ch]">
        <div className="font-display text-xl mb-1.5">Message sent.</div>
        <p className="text-sm text-muted m-0">
          Thanks for writing in — we usually reply within a day.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8 max-w-[52ch] flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="contact-name" className="text-[13px] font-medium text-ink">
          Name
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          className="h-11 px-3.5 bg-paper border border-border-input rounded-md text-sm"
          maxLength={120}
        />
        {state.fieldErrors?.name && (
          <div className="text-[12.5px] text-red-700">{state.fieldErrors.name}</div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="contact-email" className="text-[13px] font-medium text-ink">
          Email
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          className="h-11 px-3.5 bg-paper border border-border-input rounded-md text-sm"
        />
        {state.fieldErrors?.email && (
          <div className="text-[12.5px] text-red-700">{state.fieldErrors.email}</div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="contact-message" className="text-[13px] font-medium text-ink">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          className="px-3.5 py-3 bg-paper border border-border-input rounded-md text-sm resize-y"
          maxLength={4000}
        />
        {state.fieldErrors?.message && (
          <div className="text-[12.5px] text-red-700">{state.fieldErrors.message}</div>
        )}
      </div>

      {state.error && <div className="text-[12.5px] text-red-700">{state.error}</div>}

      <button
        type="submit"
        disabled={pending}
        className="h-[50px] px-6.5 bg-ink text-paper rounded-md font-body font-medium text-sm self-start hover:bg-ink-soft disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
