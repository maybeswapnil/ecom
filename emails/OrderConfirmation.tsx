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

type Item = {
  title: string;
  qty: number;
  priceLabel: string;
  sizeLabel?: string;
  frameFinish?: string;
};

type Props = {
  orderNumber: string;
  orderDate: string;
  customerFirstName: string;
  receiptUrl: string;
  items: Item[];
  subtotalLabel: string;
  shippingLabel: string;
  totalLabel: string;
  addressLines: string[];
};

export default function OrderConfirmationEmail({
  orderNumber,
  orderDate,
  customerFirstName,
  receiptUrl,
  items,
  subtotalLabel,
  shippingLabel,
  totalLabel,
  addressLines,
}: Props) {
  return (
    <EmailShell>
      <Preview>{`Order ${orderNumber} confirmed — ${BRAND_NAME}`}</Preview>
      <EmailMasthead />

      <Section style={{ padding: "34px 44px 8px" }}>
        <EmailEyebrow tone="positive">Order confirmed</EmailEyebrow>
        <EmailHeadline>{`Thank you, ${customerFirstName}.`}</EmailHeadline>
        <Text style={{ fontSize: 15, lineHeight: "1.7", color: colors.bodyText, margin: "16px 0 0" }}>
          Your prints are now with our framers. Each one is printed on archival paper and framed by
          hand — we&rsquo;ll email you the moment it&rsquo;s on its way.
        </Text>
        <Section style={{ marginTop: 22 }}>
          <table role="presentation" width="100%">
            <tr>
              <td>
                <Text style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: colors.faintSoft, margin: "0 0 3px" }}>
                  Order
                </Text>
                <Text style={{ fontSize: 13, color: colors.faint, margin: 0 }}>{orderNumber}</Text>
              </td>
              <td>
                <Text style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: colors.faintSoft, margin: "0 0 3px" }}>
                  Placed
                </Text>
                <Text style={{ fontSize: 13, color: colors.faint, margin: 0 }}>{orderDate}</Text>
              </td>
              <td>
                <Text style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: colors.faintSoft, margin: "0 0 3px" }}>
                  Payment
                </Text>
                <Text style={{ fontSize: 13, color: colors.faint, margin: 0 }}>Razorpay</Text>
              </td>
            </tr>
          </table>
        </Section>
      </Section>

      <Section style={{ padding: "16px 44px 8px" }}>
        {items.map((item, i) => (
          <table role="presentation" width="100%" key={i} style={{ borderBottom: `1px solid ${colors.borderSoft}`, padding: "18px 0" }}>
            <tr>
              <td style={{ paddingTop: 18, paddingBottom: 18, verticalAlign: "top" }}>
                <Text style={{ fontFamily: serif, fontSize: 18, color: colors.ink, margin: 0 }}>{item.title}</Text>
                {(item.sizeLabel || item.frameFinish) && (
                  <Text style={{ fontSize: 13, color: colors.muted, margin: "8px 0 0" }}>
                    {[item.sizeLabel, item.frameFinish ? `${item.frameFinish} frame` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                )}
                {item.qty > 1 && (
                  <Text style={{ fontSize: 13, color: colors.faint, margin: "4px 0 0" }}>Qty {item.qty}</Text>
                )}
              </td>
              <td style={{ paddingTop: 18, paddingBottom: 18, verticalAlign: "top", textAlign: "right", whiteSpace: "nowrap" }}>
                <Text style={{ fontFamily: serif, fontSize: 16, color: colors.ink, margin: 0 }}>{item.priceLabel}</Text>
              </td>
            </tr>
          </table>
        ))}
      </Section>

      <Section style={{ padding: "8px 44px 4px" }}>
        <table role="presentation" width="100%">
          <tr>
            <td style={{ padding: "6px 0", fontSize: 14, color: colors.muted }}>Subtotal</td>
            <td style={{ padding: "6px 0", fontSize: 14, color: colors.muted, textAlign: "right" }}>{subtotalLabel}</td>
          </tr>
          <tr>
            <td style={{ padding: "6px 0", fontSize: 14, color: colors.muted }}>Shipping</td>
            <td style={{ padding: "6px 0", fontSize: 14, color: colors.muted, textAlign: "right" }}>{shippingLabel}</td>
          </tr>
          <tr>
            <td style={{ padding: "14px 0 4px", borderTop: `1px solid ${colors.panelBorder}`, fontFamily: serif, fontSize: 19, color: colors.ink }}>
              Total
            </td>
            <td style={{ padding: "14px 0 4px", borderTop: `1px solid ${colors.panelBorder}`, fontFamily: serif, fontSize: 19, color: colors.ink, textAlign: "right" }}>
              {totalLabel}
            </td>
          </tr>
        </table>
      </Section>

      <EmailPanel>
        <table role="presentation" width="100%">
          <tr>
            <td style={{ verticalAlign: "top" }}>
              <Text style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: colors.faintSoft, margin: "0 0 6px" }}>
                Shipping to
              </Text>
              <Text style={{ fontSize: "13.5px", lineHeight: "1.6", color: colors.inkSoft, margin: 0 }}>
                {addressLines.map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < addressLines.length - 1 && <br />}
                  </span>
                ))}
              </Text>
            </td>
            <td style={{ verticalAlign: "top" }}>
              <Text style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: colors.faintSoft, margin: "0 0 6px" }}>
                Estimated dispatch
              </Text>
              <Text style={{ fontSize: "13.5px", lineHeight: "1.6", color: colors.inkSoft, margin: 0 }}>
                3–5 working days
                <br />
                Packed flat · fully insured
              </Text>
            </td>
          </tr>
        </table>
      </EmailPanel>

      <Section style={{ padding: "26px 44px 34px", textAlign: "center" }}>
        <EmailCta href={receiptUrl}>View your order</EmailCta>
        <Text style={{ fontSize: "12.5px", lineHeight: "1.6", color: colors.faint, margin: "18px 0 0" }}>
          Each print is made to order. Questions? Just reply to this email.
        </Text>
      </Section>

      <EmailFooter />
    </EmailShell>
  );
}
