import Link from "next/link";
import { policyTabs, policyDocs, type PolicyKey } from "@/lib/policy-content";
import { ContactForm } from "@/components/store/ContactForm";

export function PolicyPage({ active }: { active: PolicyKey }) {
  const doc = policyDocs[active];

  return (
    <section className="max-w-[880px] mx-auto px-7 py-20 pb-27.5">
      <div className="mb-11">
        <div className="text-[11px] tracking-[0.32em] uppercase text-muted font-medium mb-5">
          Policies &amp; help
        </div>
        <h1 className="font-display font-medium text-[clamp(36px,4.4vw,52px)] m-0 tracking-[-0.01em]">
          The fine print
        </h1>
      </div>
      <div className="flex gap-6.5 flex-wrap border-b border-hairline mb-9.5">
        {policyTabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className={`p-0 pb-3.5 font-body text-[13.5px] -mb-px border-b ${
              tab.key === active
                ? "font-semibold text-ink border-ink"
                : "font-normal text-muted border-transparent"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      <div className="max-w-[72ch]">
        <h2 className="font-display font-medium text-2xl m-0 mb-5">{doc.title}</h2>
        {doc.sections.map((section, si) => (
          <div key={si} className="mb-7">
            {section.heading && (
              <h3 className="font-display font-medium text-lg m-0 mb-3">{section.heading}</h3>
            )}
            {section.paras.map((para, pi) => (
              <p key={pi} className="text-[15.5px] leading-[1.75] text-muted-soft m-0 mb-3.5">
                {para}
              </p>
            ))}
          </div>
        ))}
        <div className="mt-7.5 text-[12.5px] text-faint">
          Last updated 5 July 2026 · Questions?{" "}
          <span className="text-ink">info@printscompany.in</span>
        </div>
        {active === "contact" && <ContactForm />}
      </div>
    </section>
  );
}
