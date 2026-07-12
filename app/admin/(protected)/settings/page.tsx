import { getCompanySettings, getHeroSettings } from "@/lib/company-settings";
import { getLiveProducts } from "@/lib/catalog";
import { CompanySettingsForm } from "@/components/admin/CompanySettingsForm";
import { HeroImageForm } from "@/components/admin/HeroImageForm";
import { TotpResetControl } from "@/components/admin/TotpResetControl";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [settings, hero, liveProducts] = await Promise.all([
    getCompanySettings(),
    getHeroSettings(),
    getLiveProducts(),
  ]);
  const productOptions = liveProducts.map((p) => ({ id: p.id, title: p.title }));

  return (
    <div>
      <h1 className="font-display text-3xl font-medium mb-6">Settings</h1>
      <div className="grid gap-6 lg:grid-cols-2 items-start max-w-6xl">
        <div className="border border-hairline rounded-xl bg-surface p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-faint mb-1">
            Company details
          </h2>
          <p className="text-sm text-muted mb-5">
            Used in the invoice PDF masthead and the footer of every transactional email.
          </p>
          <CompanySettingsForm settings={settings} />
        </div>
        <div className="border border-hairline rounded-xl bg-surface p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-faint mb-1">
            Homepage hero image
          </h2>
          <p className="text-sm text-muted mb-5">
            The large photo on the home page. Upload a new image and crop it to the 4:5 frame —
            the preview below shows how it will sit in the hero section. Optionally link it to a
            product so clicking the hero opens that product&rsquo;s page.
          </p>
          <HeroImageForm
            currentUrl={hero.imageUrl}
            currentProductId={hero.productId}
            products={productOptions}
          />
        </div>
      </div>
      <TotpResetControl />
    </div>
  );
}
