import { PolicyPage } from "@/components/store/PolicyPage";
import { policyMetadata } from "@/lib/policy-content";

export const metadata = policyMetadata("privacy");

export default function PrivacyPage() {
  return <PolicyPage active="privacy" />;
}
