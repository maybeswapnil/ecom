import { Body, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";
import { BRAND_NAME } from "@/lib/config";

type Props = {
  orderNumber: string;
  receiptUrl: string;
  items: { title: string; qty: number; priceLabel: string }[];
  totalLabel: string;
  addressLines: string[];
};

export default function OrderConfirmationEmail({
  orderNumber,
  receiptUrl,
  items,
  totalLabel,
  addressLines,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Order {orderNumber} confirmed — {BRAND_NAME}</Preview>
      <Body style={{ backgroundColor: "#F7F4ED", fontFamily: "Georgia, serif" }}>
        <Container style={{ padding: "32px 24px", maxWidth: 560 }}>
          <Heading style={{ fontSize: 28, color: "#1C1915" }}>Thank you for your order.</Heading>
          <Text style={{ color: "#6E6557" }}>
            Order {orderNumber} is confirmed. Here&rsquo;s what you ordered:
          </Text>
          <Section>
            {items.map((item) => (
              <Text key={item.title} style={{ color: "#1C1915" }}>
                {item.title} × {item.qty} — {item.priceLabel}
              </Text>
            ))}
          </Section>
          <Text style={{ fontWeight: "bold", color: "#1C1915" }}>Total: {totalLabel}</Text>
          <Text style={{ color: "#6E6557" }}>Shipping to:</Text>
          {addressLines.map((line) => (
            <Text key={line} style={{ margin: 0, color: "#1C1915" }}>
              {line}
            </Text>
          ))}
          <Text style={{ color: "#6E6557" }}>
            We&rsquo;ll dispatch within 3–4 days. Track your order any time: {receiptUrl}
          </Text>
          <Text style={{ color: "#B4AA99", fontSize: 13 }}>
            Questions? Write to info@printscompany.in
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
