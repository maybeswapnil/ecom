import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { BRAND_NAME } from "@/lib/config";

// The PDF's built-in Helvetica font has no ₹ glyph, so this formatter is
// PDF-specific — the email body and UI keep the real ₹ symbol via formatPaise.
function formatPaiseForPdf(paise: number): string {
  const rupees = Math.round(paise) / 100;
  return "Rs. " + rupees.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: "#1C1915", fontFamily: "Helvetica" },
  brand: { fontSize: 18, marginBottom: 4 },
  meta: { fontSize: 9, color: "#6E6557", marginBottom: 24 },
  sectionTitle: {
    fontSize: 9,
    color: "#6E6557",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  addressBlock: { marginBottom: 24 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#EDE8DC", paddingVertical: 6 },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1C1915",
    paddingBottom: 6,
    marginBottom: 2,
  },
  colTitle: { flex: 4 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 2, textAlign: "right" },
  colTotal: { flex: 2, textAlign: "right" },
  headerText: { fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5, color: "#6E6557" },
  totalsBlock: { marginTop: 16, alignItems: "flex-end" },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", width: 200, paddingVertical: 3 },
  totalsLabel: { color: "#6E6557" },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 200,
    paddingTop: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#1C1915",
  },
  grandTotalLabel: { fontSize: 11, fontWeight: 700 },
  footer: { marginTop: 40, fontSize: 8.5, color: "#B4AA99" },
});

export type InvoiceItem = { title: string; sku: string; qty: number; unitPricePaise: number };

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
}: InvoiceProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>{BRAND_NAME}</Text>
        <Text style={styles.meta}>
          Invoice for order {orderNumber} · {orderDate}
        </Text>

        <View style={styles.addressBlock}>
          <Text style={styles.sectionTitle}>Billed to</Text>
          <Text>{customerName}</Text>
          {addressLines.map((line) => (
            <Text key={line}>{line}</Text>
          ))}
        </View>

        <View style={styles.headerRow}>
          <Text style={[styles.colTitle, styles.headerText]}>Item</Text>
          <Text style={[styles.colQty, styles.headerText]}>Qty</Text>
          <Text style={[styles.colPrice, styles.headerText]}>Unit price</Text>
          <Text style={[styles.colTotal, styles.headerText]}>Total</Text>
        </View>
        {items.map((item) => (
          <View key={item.sku} style={styles.row}>
            <Text style={styles.colTitle}>
              {item.title}
              {"\n"}
              <Text style={{ fontSize: 8, color: "#B4AA99" }}>{item.sku}</Text>
            </Text>
            <Text style={styles.colQty}>{item.qty}</Text>
            <Text style={styles.colPrice}>{formatPaiseForPdf(item.unitPricePaise)}</Text>
            <Text style={styles.colTotal}>{formatPaiseForPdf(item.unitPricePaise * item.qty)}</Text>
          </View>
        ))}

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text>{formatPaiseForPdf(subtotalPaise)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Shipping</Text>
            <Text>{shippingPaise === 0 ? "Free" : formatPaiseForPdf(shippingPaise)}</Text>
          </View>
          {discountPaise > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Discount</Text>
              <Text>-{formatPaiseForPdf(discountPaise)}</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalLabel}>{formatPaiseForPdf(totalPaise)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          {BRAND_NAME} · Questions about this order? Write to info@printscompany.in
        </Text>
      </Page>
    </Document>
  );
}
