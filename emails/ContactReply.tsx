import { Preview, Section, Text } from "@react-email/components";
import { BRAND_NAME } from "@/lib/config";
import { EmailShell, EmailCta, colors, serif } from "@/emails/shared/EmailLayout";

type Props = {
  name: string;
  originalMessage: string;
  replyBody: string;
};

export default function ContactReplyEmail({ name, originalMessage, replyBody }: Props) {
  const greetingName = name.trim().split(/\s+/)[0] || "there";

  return (
    <EmailShell>
      <Preview>{`Re: your message to ${BRAND_NAME}`}</Preview>

      <Section
        style={{
          padding: "30px 44px 18px",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <table role="presentation">
          <tr>
            <td
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: colors.ink,
                textAlign: "center",
                verticalAlign: "middle",
              }}
            >
              <Text style={{ fontFamily: serif, fontSize: 17, color: colors.cardBg, margin: 0, lineHeight: "40px" }}>
                P
              </Text>
            </td>
            <td style={{ paddingLeft: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: 600, color: colors.ink, margin: 0 }}>
                {BRAND_NAME} Team
              </Text>
              <Text style={{ fontSize: 12, color: colors.faint, margin: 0 }}>Customer care</Text>
            </td>
          </tr>
        </table>
      </Section>

      <Section style={{ padding: "30px 44px 8px" }}>
        <Section
          style={{
            borderLeft: `2px solid #E0D6C4`,
            padding: "2px 0 2px 16px",
            color: colors.faint,
            fontSize: "13.5px",
            lineHeight: "1.65",
          }}
        >
          <Text
            style={{
              fontSize: "10.5px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 8,
              color: colors.faintSoft,
            }}
          >
            {name} wrote
          </Text>
          <Text style={{ margin: 0, color: colors.faint, fontSize: "13.5px", lineHeight: "1.65" }}>
            {originalMessage}
          </Text>
        </Section>

        <Section style={{ marginTop: 24, fontSize: 15, lineHeight: "1.75", color: "#463F32" }}>
          <Text style={{ margin: "0 0 15px" }}>Hi {greetingName},</Text>
          {replyBody.split("\n").map((line, i) =>
            line.trim() ? (
              <Text key={i} style={{ margin: "0 0 15px" }}>
                {line}
              </Text>
            ) : null
          )}
        </Section>

        <Section style={{ marginTop: 22 }}>
          <Text style={{ fontFamily: serif, fontSize: 17, color: colors.ink, margin: 0 }}>
            {BRAND_NAME} Team
          </Text>
          <Text style={{ fontSize: "12.5px", color: colors.faint, marginTop: 2 }}>
            {BRAND_NAME} · Customer care
          </Text>
        </Section>
      </Section>

      <Section style={{ padding: "24px 44px 34px", textAlign: "left" }}>
        <EmailCta href="mailto:info@printscompany.in">Reply to this email</EmailCta>
      </Section>

      <Section style={{ padding: "22px 44px 30px", borderTop: `1px solid ${colors.border}` }}>
        <Text style={{ fontSize: "11.5px", color: colors.faintSoft, letterSpacing: "0.03em", margin: 0 }}>
          info@printscompany.in · Payments by Razorpay · Made in India
        </Text>
      </Section>
    </EmailShell>
  );
}
