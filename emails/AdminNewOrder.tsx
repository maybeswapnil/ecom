import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";

type Props = {
  orderNumber: string;
  totalLabel: string;
  city: string;
  adminUrl: string;
};

export default function AdminNewOrderEmail({ orderNumber, totalLabel, city, adminUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>
        {totalLabel} — {orderNumber} ({city})
      </Preview>
      <Body style={{ backgroundColor: "#F7F4ED", fontFamily: "Georgia, serif" }}>
        <Container style={{ padding: "32px 24px", maxWidth: 560 }}>
          <Heading style={{ fontSize: 24, color: "#1C1915" }}>New order: {orderNumber}</Heading>
          <Text style={{ color: "#1C1915" }}>
            {totalLabel} from {city}.
          </Text>
          <Text style={{ color: "#6E6557" }}>View in admin: {adminUrl}</Text>
        </Container>
      </Body>
    </Html>
  );
}
