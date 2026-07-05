import { Body, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";
import { BRAND_NAME } from "@/lib/config";

type Props = {
  name: string;
  originalMessage: string;
  replyBody: string;
};

export default function ContactReplyEmail({ name, originalMessage, replyBody }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Re: your message to {BRAND_NAME}</Preview>
      <Body style={{ backgroundColor: "#F7F4ED", fontFamily: "Georgia, serif" }}>
        <Container style={{ padding: "32px 24px", maxWidth: 560 }}>
          <Heading style={{ fontSize: 28, color: "#1C1915" }}>Hi {name},</Heading>
          {replyBody.split("\n").map((line, i) =>
            line.trim() ? (
              <Text key={i} style={{ color: "#1C1915" }}>
                {line}
              </Text>
            ) : (
              <Text key={i} style={{ margin: 0, height: 8 }} />
            )
          )}
          <Section
            style={{
              marginTop: 24,
              paddingLeft: 16,
              borderLeft: "2px solid #DCD5C6",
            }}
          >
            <Text style={{ color: "#B4AA99", fontSize: 13, margin: "0 0 4px" }}>
              Your original message:
            </Text>
            <Text style={{ color: "#6E6557", fontSize: 14 }}>{originalMessage}</Text>
          </Section>
          <Text style={{ color: "#B4AA99", fontSize: 13 }}>
            Questions? Write to info@printscompany.in
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
