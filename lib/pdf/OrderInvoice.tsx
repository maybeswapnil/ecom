import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { BRAND_NAME } from "@/lib/config";

// The PDF's built-in Helvetica font has no ₹ glyph, so this formatter is
// PDF-specific — the email body and UI keep the real ₹ symbol via formatPaise.
function formatPaiseForPdf(paise: number): string {
  const rupees = Math.round(paise) / 100;
  return "Rs. " + rupees.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

const ink = "#211E19";
const inkSoft = "#3B362D";
const muted = "#6E6553";
const faint = "#9A8F79";
const faintSoft = "#A99B82";
const border = "#E4DBCA";
const borderSoft = "#ECE4D5";
const panelBg = "#F5F0E6";
const panelBorder = "#E9E1D0";
const terracotta = "#A24B34";

const styles = StyleSheet.create({
  page: { padding: 44, fontSize: 10, color: ink, fontFamily: "Helvetica" },
  brand: { fontSize: 22, color: ink },
  brandSub: { fontSize: 8.5, letterSpacing: 2, textTransform: "uppercase", color: faintSoft, marginTop: 4 },
  companyBlock: { fontSize: 9.5, lineHeight: 1.6, color: muted, marginTop: 14 },
  invoiceTitle: { fontSize: 24, color: terracotta },
  metaBlock: { fontSize: 9.5, lineHeight: 1.9, color: muted, marginTop: 12, textAlign: "right" },
  metaLabel: { color: faintSoft },
  metaValue: { color: ink },
  partiesRow: { flexDirection: "row", marginTop: 28, paddingTop: 20, borderTopWidth: 1, borderTopColor: border },
  partyCol: { flex: 1, paddingRight: 20 },
  partyLabel: { fontSize: 8.5, letterSpacing: 1, textTransform: "uppercase", color: faintSoft, marginBottom: 6 },
  partyText: { fontSize: "11px", lineHeight: 1.6, color: inkSoft },
  headerRow: { flexDirection: "row", borderBottomWidth: 1.5, borderBottomColor: ink, paddingBottom: 8, marginTop: 26 },
  colPrint: { flex: 3 },
  colSpec: { flex: 3 },
  colQty: { flex: 1, textAlign: "center" },
  colAmount: { flex: 2, textAlign: "right" },
  headerText: { fontSize: 8.5, textTransform: "uppercase", letterSpacing: 0.8, color: faintSoft, fontWeight: 700 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: borderSoft, paddingVertical: 12 },
  itemTitle: { fontSize: 13, color: ink },
  itemSku: { fontSize: 8.5, color: faint, marginTop: 3 },
  specText: { fontSize: 9.5, color: muted, lineHeight: 1.5 },
  qtyText: { fontSize: 10, color: ink, textAlign: "center" },
  amountText: { fontSize: 11, color: ink, textAlign: "right" },
  totalsBlock: { marginTop: 20, alignItems: "flex-end" },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", width: 220, paddingVertical: 4 },
  totalsLabel: { fontSize: 10.5, color: muted },
  totalsValue: { fontSize: 10.5, color: ink, textAlign: "right" },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 220,
    paddingTop: 10,
    marginTop: 6,
    borderTopWidth: 1.5,
    borderTopColor: ink,
  },
  grandTotalLabel: { fontSize: 13 },
  grandTotalValue: { fontSize: 14, textAlign: "right" },
  notes: { marginTop: 32, padding: 16, backgroundColor: panelBg, borderWidth: 1, borderColor: panelBorder, borderRadius: 4 },
  notesLabel: { fontSize: 8.5, letterSpacing: 1, textTransform: "uppercase", color: faintSoft, marginBottom: 6 },
  notesText: { fontSize: 9.5, lineHeight: 1.6, color: "#4C4639" },
  thanks: { marginTop: 22, fontSize: 11.5, color: inkSoft, textAlign: "center" },
  footer: { marginTop: 32, paddingTop: 10, borderTopWidth: 1, borderTopColor: border, fontSize: 8, color: faintSoft },
});

export type InvoiceItem = {
  title: string;
  sku: string;
  qty: number;
  unitPricePaise: number;
  sizeLabel?: string;
  frameFinish?: string;
};

export type InvoiceProps = {
  orderNumber: string;
  orderDate: string;
  customerName: string;
  addressLines: string[];
  items: InvoiceItem[];
  subtotalPaise: number;
  shippingPaise: number;
  discountPaise: number;
  totalPaise: number;
  companyName: string;
  companyAddressLines: string[];
  supportEmail: string;
  supportPhone: string;
};

export function OrderInvoiceDocument({
  orderNumber,
  orderDate,
  customerName,
  addressLines,
  items,
  subtotalPaise,
  shippingPaise,
  discountPaise,
  totalPaise,
  companyName,
  companyAddressLines,
  supportEmail,
  supportPhone,
}: InvoiceProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View>
            <Text style={styles.brand}>{BRAND_NAME}</Text>
            <Text style={styles.brandSub}>Est. 2026 · Framed in India</Text>
            <Text style={styles.companyBlock}>
              {companyName}
              {companyAddressLines.map((line) => (
                <Text key={line}>
                  {"\n"}
                  {line}
                </Text>
              ))}
            </Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>Invoice</Text>
            <View style={styles.metaBlock}>
              <Text>
                <Text style={styles.metaLabel}>Order  </Text>
                <Text style={styles.metaValue}>{orderNumber}</Text>
              </Text>
              <Text>
                <Text style={styles.metaLabel}>Issued  </Text>
                <Text style={styles.metaValue}>{orderDate}</Text>
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.partiesRow}>
          <View style={styles.partyCol}>
            <Text style={styles.partyLabel}>Billed to</Text>
            <Text style={styles.partyText}>{customerName}</Text>
            {addressLines.map((line) => (
              <Text key={line} style={styles.partyText}>
                {line}
              </Text>
            ))}
          </View>
          <View style={styles.partyCol}>
            <Text style={styles.partyLabel}>Payment</Text>
            <Text style={styles.partyText}>Razorpay</Text>
            <Text style={styles.partyText}>Paid in full</Text>
          </View>
        </View>

        <View style={styles.headerRow}>
          <Text style={[styles.colPrint, styles.headerText]}>Print</Text>
          <Text style={[styles.colSpec, styles.headerText]}>Specification</Text>
          <Text style={[styles.colQty, styles.headerText]}>Qty</Text>
          <Text style={[styles.colAmount, styles.headerText]}>Amount</Text>
        </View>
        {items.map((item) => (
          <View key={item.sku} style={styles.row}>
            <View style={styles.colPrint}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemSku}>{item.sku}</Text>
            </View>
            <View style={styles.colSpec}>
              <Text style={styles.specText}>
                {[item.sizeLabel, item.frameFinish ? `${item.frameFinish} frame` : null]
                  .filter(Boolean)
                  .join("\n") || "—"}
              </Text>
            </View>
            <Text style={styles.colQty}>{item.qty}</Text>
            <Text style={styles.colAmount}>{formatPaiseForPdf(item.unitPricePaise * item.qty)}</Text>
          </View>
        ))}

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>{formatPaiseForPdf(subtotalPaise)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Shipping</Text>
            <Text style={styles.totalsValue}>
              {shippingPaise === 0 ? "Free · Insured" : formatPaiseForPdf(shippingPaise)}
            </Text>
          </View>
          {discountPaise > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Discount</Text>
              <Text style={styles.totalsValue}>-{formatPaiseForPdf(discountPaise)}</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{formatPaiseForPdf(totalPaise)}</Text>
          </View>
        </View>

        <View style={styles.notes}>
          <Text style={styles.notesLabel}>Notes</Text>
          <Text style={styles.notesText}>
            Each print is made to order, printed on archival paper and framed by hand. Every piece
            ships packed flat and fully insured across India.
          </Text>
        </View>

        <Text style={styles.thanks}>Thank you for supporting handmade prints.</Text>

        <Text style={styles.footer}>
          {companyName} · printscompany.in · {supportEmail}
          {supportPhone ? ` · ${supportPhone}` : ""} · Payments by Razorpay · Made in India
        </Text>
      </Page>
    </Document>
  );
}
