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
    .regex(/^[6-9][0-9]{9}$/, "Enter a valid 10-digit mobile number"),
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
    // Indian mobile numbers always start with 6-9.
    phone: z.string().regex(/^\+91[6-9][0-9]{9}$/, "Phone must be +91 followed by a valid 10-digit mobile number"),
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

export const reviewSubmitSchema = z.object({
  productId: z.string().uuid("Invalid product"),
  rating: z.number().int().min(1, "Pick a star rating").max(5, "Pick a star rating"),
  body: z.string().max(2000, "Review is too long").optional().default(""),
  reviewerName: z.string().min(1, "Name is required").max(120, "Name is too long"),
});

export type ReviewSubmitValues = z.infer<typeof reviewSubmitSchema>;
export type ReviewSubmitErrors = Partial<Record<keyof ReviewSubmitValues, string>>;

export const companySettingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required").max(200, "Too long"),
  addressLine1: z.string().max(200, "Too long").optional().default(""),
  addressLine2: z.string().max(200, "Too long").optional().default(""),
  city: z.string().max(120, "Too long").optional().default(""),
  state: z.string().max(120, "Too long").optional().default(""),
  pincode: z.string().max(20, "Too long").optional().default(""),
  supportEmail: z.string().min(1, "Support email is required").email("Enter a valid email address"),
  supportPhone: z.string().max(40, "Too long").optional().default(""),
});

export type CompanySettingsValues = z.infer<typeof companySettingsSchema>;
export type CompanySettingsErrors = Partial<Record<keyof CompanySettingsValues, string>>;

// Admin form works in whole rupees; the action converts to paise for storage.
export const shippingOfferSchema = z.object({
  active: z.boolean(),
  name: z.string().min(1, "Name is required").max(120, "Too long"),
  thresholdRupees: z.coerce
    .number({ message: "Enter a threshold amount" })
    .int("Whole rupees only")
    .min(500, "Threshold must be at least ₹500")
    .max(1000000, "Threshold cannot exceed ₹10,00,000"),
  flatRateRupees: z.coerce
    .number({ message: "Enter a shipping rate" })
    .int("Whole rupees only")
    .min(0, "Cannot be negative")
    .max(10000, "Rate cannot exceed ₹10,000"),
});

export type ShippingOfferValues = z.infer<typeof shippingOfferSchema>;
export type ShippingOfferErrors = Partial<Record<keyof ShippingOfferValues, string>>;
