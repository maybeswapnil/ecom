import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";

type Props = {
  orderNumber: string;
  receiptUrl: string;
  courier: string;
  awb: string;
  trackingUrl?: string;
};

export default function ShippingConfirmationEmail({
  orderNumber,
  receiptUrl,
  courier,
  awb,
  trackingUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Your print is on its way — {orderNumber}</Preview>
      <Body style={{ backgroundColor: "#F7F4ED", fontFamily: "Georgia, serif" }}>
        <Container style={{ padding: "32px 24px", maxWidth: 560 }}>
          <Heading style={{ fontSize: 28, color: "#1C1915" }}>Your print is on its way.</Heading>
          <Text style={{ color: "#6E6557" }}>Order {orderNumber} has shipped via {courier}.</Text>
          <Text style={{ color: "#1C1915" }}>AWB: {awb}</Text>
          {trackingUrl && <Text style={{ color: "#1C1915" }}>Track: {trackingUrl}</Text>}
          <Text style={{ color: "#6E6557" }}>Full order details: {receiptUrl}</Text>
          <Text style={{ color: "#B4AA99", fontSize: 13 }}>
            Questions? Write to info@swapnilsharma.in
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
