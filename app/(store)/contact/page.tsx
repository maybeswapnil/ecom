import { PolicyPage } from "@/components/store/PolicyPage";
import { policyMetadata } from "@/lib/policy-content";

export const metadata = policyMetadata("contact");

export default function ContactPage() {
  return <PolicyPage active="contact" />;
}
