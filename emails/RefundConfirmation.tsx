import { Preview, Section, Text } from "@react-email/components";
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
  serif,
} from "@/emails/shared/EmailLayout";

type Props = {
  orderNumber: string;
  receiptUrl: string;
  amountLabel: string;
  itemsSummary?: string;
  companyName?: string;
};

export default function RefundConfirmationEmail({
  orderNumber,
  receiptUrl,
  amountLabel,
  itemsSummary,
  companyName = BRAND_NAME,
}: Props) {
  return (
    <EmailShell>
      <Preview>{`Refund processed — ${orderNumber}`}</Preview>
      <EmailMasthead companyName={companyName} />

      <Section style={{ padding: "34px 44px 8px" }}>
        <EmailEyebrow tone="positive">Refund confirmed</EmailEyebrow>
        <EmailHeadline>Your refund is on the way.</EmailHeadline>
        <Text style={{ fontSize: 15, lineHeight: "1.7", color: colors.bodyText, margin: "16px 0 0" }}>
          {itemsSummary ? (
            <>
              We&rsquo;ve received your return for{" "}
              <strong style={{ fontWeight: 600 }}>{itemsSummary}</strong> and processed your refund.
              No wall is right for every print, and that&rsquo;s completely alright.
            </>
          ) : (
            <>
              We&rsquo;ve processed your refund for order{" "}
              <strong style={{ fontWeight: 600 }}>{orderNumber}</strong>.
            </>
          )}
        </Text>
      </Section>

      <EmailPanel>
        <table role="presentation" width="100%">
          <tr>
            <td style={{ paddingBottom: 14, borderBottom: `1px solid ${colors.panelBorder}` }}>
              <Text style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: colors.faintSoft, margin: 0 }}>
                Refund amount
              </Text>
            </td>
            <td style={{ paddingBottom: 14, borderBottom: `1px solid ${colors.panelBorder}`, textAlign: "right" }}>
              <Text style={{ fontFamily: serif, fontSize: 22, color: colors.ink, margin: 0 }}>{amountLabel}</Text>
            </td>
          </tr>
          <tr>
            <td style={{ paddingTop: 14, fontSize: 13, color: colors.muted }}>To</td>
            <td style={{ paddingTop: 14, fontSize: 13, color: colors.muted, textAlign: "right" }}>
              Original payment method · via Razorpay
            </td>
          </tr>
          <tr>
            <td style={{ paddingTop: 8, fontSize: 13, color: colors.muted }}>Expected</td>
            <td style={{ paddingTop: 8, fontSize: 13, color: colors.muted, textAlign: "right" }}>
              5–7 working days
            </td>
          </tr>
          <tr>
            <td style={{ paddingTop: 8, fontSize: 13, color: colors.muted }}>Order</td>
            <td style={{ paddingTop: 8, fontSize: 13, color: colors.muted, textAlign: "right" }}>{orderNumber}</td>
          </tr>
        </table>
      </EmailPanel>

      <Section style={{ padding: "24px 44px 8px" }}>
        <Text style={{ fontSize: "13.5px", lineHeight: "1.7", color: colors.inkSoft, margin: 0 }}>
          The exact timing depends on your bank. If it hasn&rsquo;t landed after seven working days,
          reply to this email and we&rsquo;ll chase it with Razorpay for you.
        </Text>
      </Section>

      <Section style={{ padding: "22px 44px 34px", textAlign: "center" }}>
        <EmailCta href={receiptUrl}>View refund details</EmailCta>
        <Text style={{ fontSize: "12.5px", lineHeight: "1.6", color: colors.faint, margin: "18px 0 0" }}>
          When you&rsquo;re ready to try another, the whole collection is a click away.
        </Text>
      </Section>

      <EmailFooter companyName={companyName} />
    </EmailShell>
  );
}
