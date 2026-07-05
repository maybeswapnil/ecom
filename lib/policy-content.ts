export type PolicyKey = "refunds" | "shipping" | "privacy" | "terms" | "contact";

export const policyTabs: { key: PolicyKey; label: string; href: string }[] = [
  { key: "refunds", label: "Refunds", href: "/refunds" },
  { key: "shipping", label: "Shipping", href: "/shipping" },
  { key: "privacy", label: "Privacy", href: "/privacy" },
  { key: "terms", label: "Terms", href: "/terms" },
  { key: "contact", label: "Contact", href: "/contact" },
];

export const policyDocs: Record<PolicyKey, { title: string; paras: string[] }> = {
  refunds: {
    title: "Returns & refunds",
    paras: [
      "If a print doesn't feel right in your home, you may return it within 14 days of delivery for a full refund of the item price. The frame must be undamaged and in its original packaging.",
      "Because each print is made to order, we ask that you open the parcel carefully. In the rare event a print arrives damaged in transit, send us a photo within 48 hours and we'll remake and reship it at no cost — the courier insurance covers it.",
      "Refunds are processed back to your original Razorpay payment method within 5–7 business days of the returned parcel reaching our Bengaluru workshop.",
    ],
  },
  shipping: {
    title: "Shipping",
    paras: [
      "We ship anywhere in India via insured courier partners. Standard delivery is 5–7 business days; express is 2–3. Orders above ₹7,500 ship free.",
      "Every print is dispatched within 3–4 working days of your order, packed flat between rigid boards with corner protection on the frame.",
      "You'll receive a tracking link by email and SMS the moment your parcel leaves the workshop.",
    ],
  },
  privacy: {
    title: "Privacy",
    paras: [
      "We collect only what we need to fulfil your order — your name, contact details and shipping address — and we never sell it.",
      "Payments are handled entirely by Razorpay; we never see or store your card or UPI details.",
      "You can ask us to delete your data at any time by writing to info@swapnilsharma.in.",
    ],
  },
  terms: {
    title: "Terms of sale",
    paras: [
      "All prints are sold as limited editions of fifty. Copyright in every image remains with the photographer.",
      "Prices are in Indian Rupees and include applicable taxes. We reserve the right to correct pricing errors before dispatch.",
      "By placing an order you agree to these terms and to our returns and privacy policies.",
    ],
  },
  contact: {
    title: "Contact",
    paras: [
      "The fastest way to reach us is email — info@swapnilsharma.in — and the photographer answers personally, usually within a day.",
      "For questions about a live order, include your order number (it starts with PC- or FP-).",
      "Workshop: Indiranagar, Bengaluru 560038. By appointment only.",
    ],
  },
};
