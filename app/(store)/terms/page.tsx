import { PolicyPage } from "@/components/store/PolicyPage";
import { policyMetadata } from "@/lib/policy-content";

export const metadata = policyMetadata("terms");

export default function TermsPage() {
  return <PolicyPage active="terms" />;
}
