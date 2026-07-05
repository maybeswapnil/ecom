import { z } from "zod";

// Shared zod schemas — SPEC.md §2: one source of truth for client forms and API routes.

export const INDIAN_STATE_LIST = [
  "AN", "AP", "AR", "AS", "BR", "CH", "CT", "DN", "DD", "DL", "GA", "GJ", "HR", "HP", "JK", "JH",
  "KA", "KL", "LA", "LD", "MP", "MH", "MN", "ML", "MZ", "NL", "OR", "PY", "PB", "RJ", "SK", "TN",
  "TG", "TR", "UP", "UT", "WB",
] as const;

// Client-side checkout form fields — validated per field for inline error display.
// phoneLocal is the 10-digit number only (the +91 prefix is fixed and shown separately).
export const checkoutFormSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  phoneLocal: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[0-9]{10}$/, "Enter a 10-digit phone number"),
  name: z.string().min(1, "Full name is required").max(120, "Name is too long"),
  line1: z.string().min(1, "Address is required").max(120, "Address is too long"),
  city: z.string().min(1, "City is required").max(120, "City is too long"),
  state: z.enum(INDIAN_STATE_LIST, { message: "Select a state" }),
  pincode: z
    .string()
    .min(1, "Pincode is required")
    .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit Indian pincode"),
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
export type CheckoutFormErrors = Partial<Record<keyof CheckoutFormValues, string>>;

export const cartValidateSchema = z.object({
  items: z
    .array(
      z.object({
        sku: z.string().min(1),
        qty: z.number().int().min(1).max(10),
      })
    )
    .min(1)
    .max(20),
});

export const checkoutSchema = z.object({
  idempotency_key: z.string().uuid(),
  items: z
    .array(
      z.object({
        sku: z.string().min(1),
        qty: z.number().int().min(1).max(10),
      })
    )
    .min(1)
    .max(20),
  customer: z.object({
    name: z.string().min(1).max(120),
    email: z.string().email(),
    phone: z.string().regex(/^\+91[0-9]{10}$/, "Phone must be +91 followed by 10 digits"),
  }),
  address: z.object({
    line1: z.string().min(1).max(120),
    line2: z.string().max(120).optional().default(""),
    city: z.string().min(1).max(120),
    state: z.enum(INDIAN_STATE_LIST),
    pincode: z.string().regex(/^[1-9][0-9]{5}$/, "Invalid Indian pincode"),
  }),
  expected_total_paise: z.number().int().min(0),
  ph_distinct_id: z.string().optional(),
});

export const paymentVerifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(120, "Name is too long"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  message: z.string().min(1, "Message is required").max(4000, "Message is too long"),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
export type ContactFormErrors = Partial<Record<keyof ContactFormValues, string>>;

export const contactReplySchema = z.object({
  reply: z.string().min(1, "Reply cannot be empty").max(4000, "Reply is too long"),
});
