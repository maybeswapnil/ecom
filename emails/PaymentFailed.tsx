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
  amountLabel: string;
  itemsSummary: string;
  reason?: string;
  checkoutUrl: string;
  companyName?: string;
};

export default function PaymentFailedEmail({
  orderNumber,
  amountLabel,
  itemsSummary,
  reason,
  checkoutUrl,
  companyName = BRAND_NAME,
}: Props) {
  return (
    <EmailShell>
      <Preview>{`We couldn’t complete your payment — ${orderNumber}`}</Preview>
      <EmailMasthead companyName={companyName} />

      <Section style={{ padding: "34px 44px 8px" }}>
        <EmailEyebrow tone="alert">Payment unsuccessful</EmailEyebrow>
        <EmailHeadline>We couldn&rsquo;t complete your payment.</EmailHeadline>
        <Text style={{ fontSize: 15, lineHeight: "1.7", color: colors.bodyText, margin: "16px 0 0" }}>
          Not to worry — nothing has been charged. Your order for{" "}
          <strong style={{ fontWeight: 600 }}>{itemsSummary}</strong> is held, and you can finish
          checkout in a tap.
        </Text>
      </Section>

      <EmailPanel tone="alert">
        <table role="presentation" width="100%">
          <tr>
            <td>
              <Text style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#B58A78", margin: 0 }}>
                Amount due
              </Text>
            </td>
            <td style={{ textAlign: "right" }}>
              <Text style={{ fontFamily: serif, fontSize: 22, color: colors.alertText, margin: 0 }}>{amountLabel}</Text>
            </td>
          </tr>
        </table>
        {reason && (
          <Text
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: `1px solid ${colors.alertBorder}`,
              fontSize: 13,
              lineHeight: "1.6",
              color: colors.muted,
            }}
          >
            Reason: {reason}. This usually clears on a second attempt or with a different UPI app
            or card.
          </Text>
        )}
      </EmailPanel>

      <Section style={{ padding: "24px 44px 8px" }}>
        <Text style={{ fontSize: "13.5px", lineHeight: "1.7", color: colors.inkSoft, margin: 0 }}>
          We&rsquo;ll hold this reservation for <strong style={{ fontWeight: 600 }}>24 hours</strong>.
          After that, the prints return to the collection — and with limited editions, we can&rsquo;t
          always promise the same number.
        </Text>
      </Section>

      <Section style={{ padding: "22px 44px 34px", textAlign: "center" }}>
        <EmailCta href={checkoutUrl}>Complete your payment</EmailCta>
        <Text style={{ fontSize: "12.5px", lineHeight: "1.6", color: colors.faint, margin: "18px 0 0" }}>
          Secure checkout via Razorpay. Trouble paying? Reply and we&rsquo;ll help.
        </Text>
      </Section>

      <EmailFooter companyName={companyName} />
    </EmailShell>
  );
}
