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
  courier: string;
  awb: string;
  itemsSummary: string;
  estimatedArrival?: string;
  trackingUrl?: string;
  companyName?: string;
};

export default function ShippingConfirmationEmail({
  orderNumber,
  receiptUrl,
  courier,
  awb,
  itemsSummary,
  estimatedArrival,
  trackingUrl,
  companyName = BRAND_NAME,
}: Props) {
  return (
    <EmailShell>
      <Preview>{`Your print is on its way — ${orderNumber}`}</Preview>
      <EmailMasthead companyName={companyName} />

      <Section style={{ padding: "34px 44px 8px" }}>
        <EmailEyebrow>On its way</EmailEyebrow>
        <EmailHeadline>Your prints have been dispatched.</EmailHeadline>
        <Text style={{ fontSize: 15, lineHeight: "1.7", color: colors.bodyText, margin: "16px 0 0" }}>
          Framed, wrapped, and packed flat with plenty of care. Order{" "}
          <strong style={{ fontWeight: 600 }}>{orderNumber}</strong> is now with the courier.
        </Text>
      </Section>

      <EmailPanel>
        <table role="presentation" width="100%">
          <tr>
            <td style={{ verticalAlign: "top" }}>
              <Text style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: colors.faintSoft, margin: "0 0 5px" }}>
                Courier
              </Text>
              <Text style={{ fontFamily: serif, fontSize: 17, color: colors.ink, margin: 0 }}>{courier}</Text>
              <Text style={{ fontSize: "12.5px", color: colors.faint, margin: "3px 0 0" }}>AWB {awb}</Text>
            </td>
            {estimatedArrival && (
              <td style={{ verticalAlign: "top", textAlign: "right" }}>
                <Text style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: colors.faintSoft, margin: "0 0 5px" }}>
                  Estimated arrival
                </Text>
                <Text style={{ fontFamily: serif, fontSize: 17, color: colors.ink, margin: 0 }}>{estimatedArrival}</Text>
              </td>
            )}
          </tr>
        </table>
      </EmailPanel>

      <Section style={{ padding: "22px 44px 4px" }}>
        <Text style={{ fontFamily: serif, fontSize: 17, color: colors.ink, margin: 0 }}>{itemsSummary}</Text>
      </Section>

      <Section style={{ padding: "26px 44px 34px", textAlign: "center" }}>
        <EmailCta href={trackingUrl ?? receiptUrl}>Track your parcel</EmailCta>
        <Text style={{ fontSize: "12.5px", lineHeight: "1.6", color: colors.faint, margin: "18px 0 0" }}>
          Your shipment is fully insured. If the packaging arrives damaged, photograph it and reply
          here.
        </Text>
      </Section>

      <EmailFooter companyName={companyName} />
    </EmailShell>
  );
}
