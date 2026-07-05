import { PolicyPage } from "@/components/store/PolicyPage";
import { policyMetadata } from "@/lib/policy-content";

export const metadata = policyMetadata("shipping");

export default function ShippingPage() {
  return <PolicyPage active="shipping" />;
}
