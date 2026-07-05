import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";

type Props = {
  orderNumber: string;
  amountLabel: string;
};

export default function RefundConfirmationEmail({ orderNumber, amountLabel }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Refund processed — {orderNumber}</Preview>
      <Body style={{ backgroundColor: "#F7F4ED", fontFamily: "Georgia, serif" }}>
        <Container style={{ padding: "32px 24px", maxWidth: 560 }}>
          <Heading style={{ fontSize: 28, color: "#1C1915" }}>Refund processed.</Heading>
          <Text style={{ color: "#6E6557" }}>
            We&rsquo;ve refunded {amountLabel} for order {orderNumber}.
          </Text>
          <Text style={{ color: "#1C1915" }}>
            It should reflect in your original payment method within 5–7 business days.
          </Text>
          <Text style={{ color: "#B4AA99", fontSize: 13 }}>
            Questions? Write to info@swapnilsharma.in
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
