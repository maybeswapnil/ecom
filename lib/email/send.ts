import { Resend } from "resend";
import OrderConfirmationEmail from "@/emails/OrderConfirmation";
import ShippingConfirmationEmail from "@/emails/ShippingConfirmation";
import RefundConfirmationEmail from "@/emails/RefundConfirmation";
import AdminNewOrderEmail from "@/emails/AdminNewOrder";
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
  to: string;
  token: string;
  items: { title: string; qty: number; priceLabel: string }[];
  totalLabel: string;
  addressLines: string[];
}): Promise<SendResult> {
  const resend = client();
  if (!resend) return { sent: false, reason: "RESEND_API_KEY is not configured" };

  const { error } = await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Order ${params.orderNumber} confirmed — ${BRAND_NAME}`,
    react: OrderConfirmationEmail({
      orderNumber: params.orderNumber,
      receiptUrl: `${SITE_URL}/order/${params.orderNumber}?t=${params.token}`,
      items: params.items,
      totalLabel: params.totalLabel,
      addressLines: params.addressLines,
    }),
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

  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!to) return { sent: false, reason: "ADMIN_NOTIFY_EMAIL is not configured" };

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
  trackingUrl?: string;
}): Promise<SendResult> {
  const resend = client();
  if (!resend) return { sent: false, reason: "RESEND_API_KEY is not configured" };

  const { error } = await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Your print is on its way — ${params.orderNumber}`,
    react: ShippingConfirmationEmail({
      orderNumber: params.orderNumber,
      receiptUrl: `${SITE_URL}/order/${params.orderNumber}`,
      courier: params.courier,
      awb: params.awb,
      trackingUrl: params.trackingUrl,
    }),
  });

  if (error) return { sent: false, reason: error.message };
  return { sent: true };
}

export async function sendRefundConfirmationEmail(params: {
  orderNumber: string;
  to: string;
  amountLabel: string;
}): Promise<SendResult> {
  const resend = client();
  if (!resend) return { sent: false, reason: "RESEND_API_KEY is not configured" };

  const { error } = await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Refund processed — ${params.orderNumber}`,
    react: RefundConfirmationEmail({
      orderNumber: params.orderNumber,
      amountLabel: params.amountLabel,
    }),
  });

  if (error) return { sent: false, reason: error.message };
  return { sent: true };
}
