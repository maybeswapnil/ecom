import { Resend } from "resend";
import { renderToBuffer } from "@react-pdf/renderer";
import OrderConfirmationEmail from "@/emails/OrderConfirmation";
import ShippingConfirmationEmail from "@/emails/ShippingConfirmation";
import RefundConfirmationEmail from "@/emails/RefundConfirmation";
import AdminNewOrderEmail from "@/emails/AdminNewOrder";
import ContactReplyEmail from "@/emails/ContactReply";
import DeliveredEmail from "@/emails/Delivered";
import PaymentFailedEmail from "@/emails/PaymentFailed";
import OrderCanceledEmail from "@/emails/OrderCanceled";
import { OrderInvoiceDocument, type InvoiceItem } from "@/lib/pdf/OrderInvoice";
import { getCompanySettings, companySettingsAddressLines } from "@/lib/company-settings";
import { BRAND_NAME, SITE_URL } from "@/lib/config";

type SendResult = { sent: true } | { sent: false; reason: string };

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const FROM = process.env.EMAIL_FROM ?? `${BRAND_NAME} <info@printscompany.in>`;

export async function sendOrderConfirmationEmail(params: {
  orderNumber: string;
  orderDate: string;
  customerFirstName: string;
  to: string;
  token: string;
  items: { title: string; qty: number; priceLabel: string; sizeLabel?: string; frameFinish?: string }[];
  subtotalLabel: string;
  shippingLabel: string;
  totalLabel: string;
  addressLines: string[];
  invoice?: {
    orderDate: string;
    customerName: string;
    items: InvoiceItem[];
    subtotalPaise: number;
    shippingPaise: number;
    discountPaise: number;
    totalPaise: number;
  };
}): Promise<SendResult> {
  const resend = client();
  if (!resend) return { sent: false, reason: "RESEND_API_KEY is not configured" };

  const settings = await getCompanySettings();

  let attachments: { filename: string; content: Buffer }[] | undefined;
  if (params.invoice) {
    const pdfBuffer = await renderToBuffer(
      OrderInvoiceDocument({
        orderNumber: params.orderNumber,
        orderDate: params.invoice.orderDate,
        customerName: params.invoice.customerName,
        addressLines: params.addressLines,
        items: params.invoice.items,
        subtotalPaise: params.invoice.subtotalPaise,
        shippingPaise: params.invoice.shippingPaise,
        discountPaise: params.invoice.discountPaise,
        totalPaise: params.invoice.totalPaise,
        companyName: settings.companyName,
        companyAddressLines: companySettingsAddressLines(settings),
        supportEmail: settings.supportEmail,
        supportPhone: settings.supportPhone,
      })
    );
    attachments = [{ filename: `invoice-${params.orderNumber}.pdf`, content: pdfBuffer }];
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Order ${params.orderNumber} confirmed — ${settings.companyName}`,
    react: OrderConfirmationEmail({
      orderNumber: params.orderNumber,
      orderDate: params.orderDate,
      customerFirstName: params.customerFirstName,
      receiptUrl: `${SITE_URL}/order/${params.orderNumber}?t=${params.token}`,
      items: params.items,
      subtotalLabel: params.subtotalLabel,
      shippingLabel: params.shippingLabel,
      totalLabel: params.totalLabel,
      addressLines: params.addressLines,
      companyName: settings.companyName,
    }),
    attachments,
  });

  if (error) return { sent: false, reason: error.message };
  return { sent: true };
}

export async function sendAdminNewOrderEmail(params: {
  orderNumber: string;
  orderId: string;
  totalLabel: string;
  city: string;
}): Promise<SendResult> {
  const resend = client();
  if (!resend) return { sent: false, reason: "RESEND_API_KEY is not configured" };

  const to = process.env.ADMIN_NOTIFY_EMAIL?.split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (!to || to.length === 0) return { sent: false, reason: "ADMIN_NOTIFY_EMAIL is not configured" };

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `${params.totalLabel} — ${params.orderNumber} (${params.city})`,
    react: AdminNewOrderEmail({
      orderNumber: params.orderNumber,
      totalLabel: params.totalLabel,
      city: params.city,
      adminUrl: `${SITE_URL}/admin/orders/${params.orderId}`,
    }),
  });

  if (error) return { sent: false, reason: error.message };
  return { sent: true };
}

export async function sendShippingConfirmationEmail(params: {
  orderNumber: string;
  to: string;
  courier: string;
  awb: string;
  itemsSummary: string;
  estimatedArrival?: string;
  trackingUrl?: string;
}): Promise<SendResult> {
  const resend = client();
  if (!resend) return { sent: false, reason: "RESEND_API_KEY is not configured" };

  const settings = await getCompanySettings();

  const { error } = await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Your print is on its way — ${params.orderNumber}`,
    react: ShippingConfirmationEmail({
      orderNumber: params.orderNumber,
      receiptUrl: `${SITE_URL}/order/${params.orderNumber}`,
      courier: params.courier,
      awb: params.awb,
      itemsSummary: params.itemsSummary,
      estimatedArrival: params.estimatedArrival,
      trackingUrl: params.trackingUrl,
      companyName: settings.companyName,
    }),
  });

  if (error) return { sent: false, reason: error.message };
  return { sent: true };
}

export async function sendRefundConfirmationEmail(params: {
  orderNumber: string;
  to: string;
  amountLabel: string;
  itemsSummary?: string;
}): Promise<SendResult> {
  const resend = client();
  if (!resend) return { sent: false, reason: "RESEND_API_KEY is not configured" };

  const settings = await getCompanySettings();

  const { error } = await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Refund processed — ${params.orderNumber}`,
    react: RefundConfirmationEmail({
      orderNumber: params.orderNumber,
      receiptUrl: `${SITE_URL}/order/${params.orderNumber}`,
      amountLabel: params.amountLabel,
      itemsSummary: params.itemsSummary,
      companyName: settings.companyName,
    }),
  });

  if (error) return { sent: false, reason: error.message };
  return { sent: true };
}

export async function sendDeliveredEmail(params: {
  orderNumber: string;
  to: string;
}): Promise<SendResult> {
  const resend = client();
  if (!resend) return { sent: false, reason: "RESEND_API_KEY is not configured" };

  const settings = await getCompanySettings();

  const { error } = await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Your prints have arrived — ${params.orderNumber}`,
    react: DeliveredEmail({
      orderNumber: params.orderNumber,
      receiptUrl: `${SITE_URL}/order/${params.orderNumber}`,
      companyName: settings.companyName,
    }),
  });

  if (error) return { sent: false, reason: error.message };
  return { sent: true };
}

export async function sendPaymentFailedEmail(params: {
  orderNumber: string;
  to: string;
  amountLabel: string;
  itemsSummary: string;
  reason?: string;
  checkoutUrl: string;
}): Promise<SendResult> {
  const resend = client();
  if (!resend) return { sent: false, reason: "RESEND_API_KEY is not configured" };

  const settings = await getCompanySettings();

  const { error } = await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `We couldn’t complete your payment — ${params.orderNumber}`,
    react: PaymentFailedEmail({
      orderNumber: params.orderNumber,
      amountLabel: params.amountLabel,
      itemsSummary: params.itemsSummary,
      reason: params.reason,
      checkoutUrl: params.checkoutUrl,
      companyName: settings.companyName,
    }),
  });

  if (error) return { sent: false, reason: error.message };
  return { sent: true };
}

export async function sendOrderCanceledEmail(params: {
  orderNumber: string;
  to: string;
  amountLabel: string;
  itemsSummary: string;
}): Promise<SendResult> {
  const resend = client();
  if (!resend) return { sent: false, reason: "RESEND_API_KEY is not configured" };

  const settings = await getCompanySettings();

  const { error } = await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Your order has been canceled — ${params.orderNumber}`,
    react: OrderCanceledEmail({
      orderNumber: params.orderNumber,
      amountLabel: params.amountLabel,
      itemsSummary: params.itemsSummary,
      browseUrl: `${SITE_URL}/prints`,
      companyName: settings.companyName,
    }),
  });

  if (error) return { sent: false, reason: error.message };
  return { sent: true };
}

export async function sendContactReplyEmail(params: {
  to: string;
  name: string;
  originalMessage: string;
  replyBody: string;
}): Promise<SendResult> {
  const resend = client();
  if (!resend) return { sent: false, reason: "RESEND_API_KEY is not configured" };

  const settings = await getCompanySettings();

  const { error } = await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Re: your message to ${settings.companyName}`,
    react: ContactReplyEmail({
      name: params.name,
      originalMessage: params.originalMessage,
      replyBody: params.replyBody,
      companyName: settings.companyName,
      supportEmail: settings.supportEmail,
    }),
  });

  if (error) return { sent: false, reason: error.message };
  return { sent: true };
}
