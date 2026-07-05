import { PolicyPage } from "@/components/store/PolicyPage";
import { policyMetadata } from "@/lib/policy-content";

export const metadata = policyMetadata("refunds");

export default function RefundsPage() {
  return <PolicyPage active="refunds" />;
}
