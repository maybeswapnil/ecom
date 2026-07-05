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
  browseUrl: string;
  companyName?: string;
};

export default function OrderCanceledEmail({
  orderNumber,
  amountLabel,
  itemsSummary,
  browseUrl,
  companyName = BRAND_NAME,
}: Props) {
  return (
    <EmailShell>
      <Preview>{`Your order has been canceled — ${orderNumber}`}</Preview>
      <EmailMasthead companyName={companyName} />

      <Section style={{ padding: "34px 44px 8px" }}>
        <EmailEyebrow tone="alert">Order canceled</EmailEyebrow>
        <EmailHeadline>Your order has been canceled.</EmailHeadline>
        <Text style={{ fontSize: 15, lineHeight: "1.7", color: colors.bodyText, margin: "16px 0 0" }}>
          Order <strong style={{ fontWeight: 600 }}>{orderNumber}</strong> has been canceled before
          reaching our framers. No frames were cut, and nothing is on its way.
        </Text>
      </Section>

      <Section style={{ padding: "22px 44px 4px" }}>
        <table role="presentation" width="100%" style={{ borderBottom: `1px solid ${colors.borderSoft}`, paddingBottom: 18 }}>
          <tr>
            <td>
              <Text style={{ fontFamily: serif, fontSize: 17, color: colors.ink, margin: 0 }}>{itemsSummary}</Text>
            </td>
            <td style={{ textAlign: "right" }}>
              <Text style={{ fontFamily: serif, fontSize: 16, color: colors.faint, textDecoration: "line-through", margin: 0 }}>
                {amountLabel}
              </Text>
            </td>
          </tr>
        </table>
      </Section>

      <EmailPanel>
        <Text style={{ fontSize: "13.5px", lineHeight: "1.7", color: colors.inkSoft, margin: 0 }}>
          You were not charged for this order — no payment was completed, so there&rsquo;s nothing
          to refund.
        </Text>
      </EmailPanel>

      <Section style={{ padding: "26px 44px 34px", textAlign: "center" }}>
        <EmailCta href={browseUrl}>Browse the collection</EmailCta>
        <Text style={{ fontSize: "12.5px", lineHeight: "1.6", color: colors.faint, margin: "18px 0 0" }}>
          Changed your mind? Reply and we&rsquo;ll help you reorder.
        </Text>
      </Section>

      <EmailFooter companyName={companyName} />
    </EmailShell>
  );
}
