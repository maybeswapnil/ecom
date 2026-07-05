import { Body, Container, Head, Html, Link, Section, Text } from "@react-email/components";
import { Font } from "@react-email/font";
import { BRAND_NAME } from "@/lib/config";

export const colors = {
  ink: "#211E19",
  inkSoft: "#3B362D",
  bodyText: "#524B3D",
  muted: "#6E6553",
  faint: "#9A8F79",
  faintSoft: "#A99B82",
  border: "#EFE7D8",
  borderSoft: "#ECE4D5",
  panelBg: "#F5F0E6",
  panelBorder: "#E9E1D0",
  cardBg: "#FBF8F2",
  desert: "#D9D2C3",
  terracotta: "#A24B34",
  green: "#5F6E4E",
  alertBg: "#F7EDE8",
  alertBorder: "#EBD6CC",
  alertText: "#7C3A28",
};

export const serif = "'Newsreader', Georgia, serif";
export const sans = "'Instrument Sans', -apple-system, Helvetica, Arial, sans-serif";

export function EmailFonts() {
  return (
    <Font
      fontFamily="Newsreader"
      fallbackFontFamily="Georgia"
      webFont={{
        url: "https://fonts.gstatic.com/s/newsreader/v26/cY9qfjOCX1hbuyalUrK49dLac06G1ZGsZBtoBCzBDXXD9JVF438weI_ADA.ttf",
        format: "truetype",
      }}
      fontWeight={400}
      fontStyle="normal"
    />
  );
}

export function EmailShell({ children }: { children: React.ReactNode }) {
  return (
    <Html>
      <Head>
        <EmailFonts />
      </Head>
      <Body style={{ backgroundColor: colors.desert, fontFamily: sans, margin: 0, padding: 0 }}>
        <Container
          style={{
            maxWidth: 560,
            margin: "0 auto",
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.border}`,
          }}
        >
          {children}
        </Container>
      </Body>
    </Html>
  );
}

export function EmailMasthead() {
  return (
    <Section style={{ padding: "34px 44px 22px", textAlign: "center", borderBottom: `1px solid ${colors.border}` }}>
      <Text style={{ fontFamily: serif, fontSize: 22, color: colors.ink, margin: 0, letterSpacing: "0.01em" }}>
        {BRAND_NAME}
      </Text>
      <Text
        style={{
          marginTop: 5,
          fontSize: 10,
          letterSpacing: "0.26em",
          textTransform: "uppercase",
          color: colors.faintSoft,
          margin: "5px 0 0",
        }}
      >
        Est. 2026 · Framed in India
      </Text>
    </Section>
  );
}

export function EmailFooter() {
  return (
    <Section style={{ padding: "24px 44px 32px", borderTop: `1px solid ${colors.border}`, textAlign: "center" }}>
      <Text style={{ fontFamily: serif, fontSize: 15, color: colors.inkSoft, margin: 0 }}>{BRAND_NAME}</Text>
      <Text style={{ marginTop: 6, fontSize: "12.5px", lineHeight: "1.6", color: colors.faint, margin: "6px 0 0" }}>
        Fine-art photographic prints, framed by hand
        <br />
        and shipped insured across India.
      </Text>
      <Section style={{ marginTop: 14 }}>
        <Link href="https://printscompany.in/shipping" style={{ color: colors.terracotta, fontSize: 12, textDecoration: "none", marginRight: 18 }}>
          Shipping
        </Link>
        <Link href="https://printscompany.in/refunds" style={{ color: colors.terracotta, fontSize: 12, textDecoration: "none", marginRight: 18 }}>
          Returns
        </Link>
        <Link href="https://printscompany.in/contact" style={{ color: colors.terracotta, fontSize: 12, textDecoration: "none" }}>
          Contact
        </Link>
      </Section>
      <Text style={{ marginTop: 16, fontSize: 11, color: colors.faintSoft, margin: "16px 0 0" }}>
        Payments by Razorpay · © 2026 {BRAND_NAME} · Made in India
      </Text>
    </Section>
  );
}

export function EmailEyebrow({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "positive" | "neutral" | "alert" }) {
  const toneColor = tone === "positive" ? colors.green : tone === "alert" ? colors.terracotta : colors.terracotta;
  return (
    <Text
      style={{
        fontSize: "11.5px",
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: toneColor,
        fontWeight: 600,
        margin: 0,
      }}
    >
      {children}
    </Text>
  );
}

export function EmailHeadline({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontFamily: serif,
        fontSize: 29,
        fontWeight: 400,
        lineHeight: "1.15",
        color: colors.ink,
        margin: "12px 0 0",
      }}
    >
      {children}
    </Text>
  );
}

export function EmailCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-block",
        backgroundColor: colors.ink,
        color: colors.cardBg,
        fontSize: "13.5px",
        fontWeight: 500,
        letterSpacing: "0.03em",
        padding: "14px 30px",
        borderRadius: 2,
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}

/** A colored panel inset from the card edges. Uses padding (not margin) on the
 *  outer Section — a 100%-width table with a horizontal margin overflows its
 *  parent instead of shrinking, which is what caused the panel to bleed past
 *  the card edge in earlier iterations. */
export function EmailPanel({
  children,
  tone = "neutral",
  topSpacing = 24,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "alert";
  topSpacing?: number;
}) {
  const bg = tone === "alert" ? colors.alertBg : colors.panelBg;
  const border = tone === "alert" ? colors.alertBorder : colors.panelBorder;
  return (
    <Section style={{ padding: `${topSpacing}px 44px 0` }}>
      <Section style={{ padding: "18px 20px", backgroundColor: bg, border: `1px solid ${border}`, borderRadius: 4 }}>
        {children}
      </Section>
    </Section>
  );
}
