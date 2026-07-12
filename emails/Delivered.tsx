import { Link, Preview, Section, Text } from "@react-email/components";
import { BRAND_NAME } from "@/lib/config";
import {
  EmailShell,
  EmailMasthead,
  EmailFooter,
  EmailEyebrow,
  EmailHeadline,
  EmailCta,
  EmailPanel,
  colors,
} from "@/emails/shared/EmailLayout";

type Props = {
  orderNumber: string;
  receiptUrl: string;
  reviewUrl: string;
  companyName?: string;
};

export default function DeliveredEmail({
  orderNumber,
  receiptUrl,
  reviewUrl,
  companyName = BRAND_NAME,
}: Props) {
  return (
    <EmailShell>
      <Preview>{`Your prints have arrived — ${orderNumber}`}</Preview>
      <EmailMasthead companyName={companyName} />

      <Section style={{ padding: "34px 44px 8px" }}>
        <EmailEyebrow tone="positive">Delivered</EmailEyebrow>
        <EmailHeadline>It&rsquo;s arrived. Now for the wall.</EmailHeadline>
        <Text style={{ fontSize: 15, lineHeight: "1.7", color: colors.bodyText, margin: "16px 0 0" }}>
          Order <strong style={{ fontWeight: 600 }}>{orderNumber}</strong> was delivered today. We
          hope it looks like it belongs there — that&rsquo;s always the moment we make these for.
        </Text>
      </Section>

      <EmailPanel>
        <Text style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: colors.faintSoft, margin: "0 0 10px" }}>
          Caring for your print
        </Text>
        <Text style={{ fontSize: "13.5px", lineHeight: "1.7", color: colors.inkSoft, margin: 0 }}>
          Hang it out of direct sunlight to protect the archival inks. Dust the glass with a dry,
          soft cloth — never a damp one. That&rsquo;s all it needs for decades.
        </Text>
      </EmailPanel>

      <Section style={{ padding: "26px 44px 34px", textAlign: "center" }}>
        <EmailCta href={reviewUrl}>Rate your prints</EmailCta>
        <Text style={{ fontSize: "12.5px", lineHeight: "1.6", color: colors.faint, margin: "18px 0 0" }}>
          Or{" "}
          <Link href={receiptUrl} style={{ color: colors.inkSoft }}>
            view your order
          </Link>
          . And if it isn&rsquo;t quite right, our returns policy has you covered — just reply to
          this email.
        </Text>
      </Section>

      <EmailFooter companyName={companyName} />
    </EmailShell>
  );
}
