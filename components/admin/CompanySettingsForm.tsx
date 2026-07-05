"use client";

import { useActionState } from "react";
import { updateCompanySettings, type UpdateCompanySettingsState } from "@/lib/admin/settings-actions";
import type { CompanySettings } from "@/lib/company-settings";

const initialState: UpdateCompanySettingsState = {};

function Field({
  label,
  name,
  defaultValue,
  error,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue: string;
  error?: string;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-[13px] font-medium text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="h-10 px-3 bg-paper border border-border-input rounded-md text-sm"
      />
      {error && <div className="text-[12.5px] text-red-700">{error}</div>}
    </div>
  );
}

export function CompanySettingsForm({ settings }: { settings: CompanySettings }) {
  const [state, formAction, pending] = useActionState(updateCompanySettings, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field
        label="Company name"
        name="companyName"
        defaultValue={settings.companyName}
        error={state.fieldErrors?.companyName}
      />
      <Field
        label="Address line 1"
        name="addressLine1"
        defaultValue={settings.addressLine1}
        error={state.fieldErrors?.addressLine1}
      />
      <Field
        label="Address line 2"
        name="addressLine2"
        defaultValue={settings.addressLine2}
        error={state.fieldErrors?.addressLine2}
      />
      <div className="grid grid-cols-3 gap-3">
        <Field label="City" name="city" defaultValue={settings.city} error={state.fieldErrors?.city} />
        <Field label="State" name="state" defaultValue={settings.state} error={state.fieldErrors?.state} />
        <Field
          label="Pincode"
          name="pincode"
          defaultValue={settings.pincode}
          error={state.fieldErrors?.pincode}
        />
      </div>
      <Field
        label="Support email"
        name="supportEmail"
        type="email"
        defaultValue={settings.supportEmail}
        error={state.fieldErrors?.supportEmail}
      />
      <Field
        label="Support phone"
        name="supportPhone"
        defaultValue={settings.supportPhone}
        error={state.fieldErrors?.supportPhone}
      />

      {state.error && <div className="text-[12.5px] text-red-700">{state.error}</div>}
      {state.success && <div className="text-[12.5px] text-green-800">Settings saved.</div>}

      <button
        type="submit"
        disabled={pending}
        className="h-10 px-4 bg-ink text-paper rounded-md text-sm font-medium self-start disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
