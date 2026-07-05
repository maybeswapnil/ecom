import { Preview, Section, Text } from "@react-email/components";
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
};

export default function DeliveredEmail({ orderNumber, receiptUrl }: Props) {
  return (
    <EmailShell>
      <Preview>{`Your prints have arrived — ${orderNumber}`}</Preview>
      <EmailMasthead />

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
        <EmailCta href={receiptUrl}>View your order</EmailCta>
        <Text style={{ fontSize: "12.5px", lineHeight: "1.6", color: colors.faint, margin: "18px 0 0" }}>
          We love seeing where they end up. And if it isn&rsquo;t quite right, our returns policy
          has you covered — just reply to this email.
        </Text>
      </Section>

      <EmailFooter />
    </EmailShell>
  );
}
