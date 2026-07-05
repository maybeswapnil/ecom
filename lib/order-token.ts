import crypto from "node:crypto";

export function receiptToken(orderNumber: string): string {
  const secret = process.env.ORDER_TOKEN_SECRET;
  if (!secret) throw new Error("ORDER_TOKEN_SECRET is not configured");
  return crypto.createHmac("sha256", secret).update(orderNumber).digest("hex").slice(0, 32);
}

export function isValidReceiptToken(orderNumber: string, token: string): boolean {
  const expected = receiptToken(orderNumber);
  const bufA = Buffer.from(expected);
  const bufB = Buffer.from(token);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
