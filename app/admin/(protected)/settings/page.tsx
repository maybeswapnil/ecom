import { getCompanySettings } from "@/lib/company-settings";
import { CompanySettingsForm } from "@/components/admin/CompanySettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getCompanySettings();

  return (
    <div>
      <h1 className="font-display text-3xl font-medium mb-6">Settings</h1>
      <div className="max-w-xl border border-hairline rounded-xl bg-surface p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-faint mb-1">
          Company details
        </h2>
        <p className="text-sm text-muted mb-5">
          Used in the invoice PDF masthead and the footer of every transactional email.
        </p>
        <CompanySettingsForm settings={settings} />
      </div>
    </div>
  );
}
