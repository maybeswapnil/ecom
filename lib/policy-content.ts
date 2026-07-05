import type { Metadata } from "next";
import { BRAND_NAME, SITE_URL } from "@/lib/config";

export type PolicyKey = "refunds" | "shipping" | "privacy" | "terms" | "contact";

export const policyTabs: { key: PolicyKey; label: string; href: string }[] = [
  { key: "refunds", label: "Refunds", href: "/refunds" },
  { key: "shipping", label: "Shipping", href: "/shipping" },
  { key: "privacy", label: "Privacy", href: "/privacy" },
  { key: "terms", label: "Terms", href: "/terms" },
  { key: "contact", label: "Contact", href: "/contact" },
];

export type PolicySection = { heading?: string; paras: string[] };

export const policyDocs: Record<PolicyKey, { title: string; sections: PolicySection[] }> = {
  shipping: {
    title: "Shipping policy",
    sections: [
      {
        heading: "Domestic shipping",
        paras: [
          "All orders usually get shipped within 5–7 working days (unless otherwise mentioned in the product description section). So you can expect a delivery between 7–10 days.",
          "You will get a tracking link in your inbox as soon as your order is shipped. Please allow 24 hours for the status of the shipment to correctly display at the tracking link.",
          "In the event that the delivery address is not easily accessible, delivery time may be in excess of our estimate as aforesaid. For confirmation of the delivery address, you may be contacted on your email id or phone number provided by you.",
          `We only make use of reliable courier companies and/or Speed Post. ${BRAND_NAME} is not liable for any delays in delivery by the courier company/Speed Post or on account of any factors beyond the control of ${BRAND_NAME}. We shall endeavor to ensure timely delivery of your order within the estimated time as mentioned in the order confirmation.`,
          `In the unlikely event that delivery is not possible for any reasons outside the control of ${BRAND_NAME}, including but not limited to poor courier services in the delivery area, inaccessibility of the delivery area, force majeure events as laid out hereinafter, we shall inform you of such inability to deliver and cancel your order, followed by a full refund.`,
        ],
      },
      {
        heading: "International shipping",
        paras: [
          "For international orders, please allow 10–15 working days for delivery, depending on your location. In some cases, it may take longer due to customs processing or other factors beyond our control.",
          "International customers will receive a tracking link once the order is shipped. Please allow 48 hours for the tracking information to update.",
          "Please be aware that international shipments may be subject to customs duties, taxes, and other charges, which are the responsibility of the recipient. We recommend checking with your local customs office to determine any additional costs prior to purchase.",
          `${BRAND_NAME} is not liable for any delays due to customs or unforeseen circumstances. If delivery is not possible due to international shipping restrictions or any factors beyond our control, we will inform you and provide a full refund.`,
        ],
      },
    ],
  },
  refunds: {
    title: "Return / refund / replacement policy",
    sections: [
      {
        heading: "Damaged product",
        paras: [
          "If you have received a damaged product, please do not worry. Drop us an email at info@printscompany.in with images of the damaged product within 48 hours of receiving the order. We will assess the damage and provide a replacement or refund based on your preference.",
          "The full amount will be refunded, and it may reflect in your account within 7–10 business days from the date the refund is processed.",
        ],
      },
      {
        heading: "Cancellation",
        paras: ["Since all prints are made-to-order, we do not accept any cancellation requests."],
      },
      {
        heading: "Processing orders",
        paras: [
          "Our business hours are 10:00 AM to 6:00 PM Indian Standard Time (IST), Monday through Friday. For any queries, please write to us at info@printscompany.in, and we will respond as soon as possible.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy policy",
    sections: [
      {
        paras: [
          `This Privacy Policy describes how ${BRAND_NAME} (the "Site", "we", "us", or "our") collects, uses, and discloses your personal information when you visit, use our services, or make a purchase from printscompany.in (the "Site") or otherwise communicate with us regarding the Site (collectively, the "Services"). For purposes of this Privacy Policy, "you" and "your" means you as the user of the Services, whether you are a customer, website visitor, or another individual whose information we have collected pursuant to this Privacy Policy.`,
          "Please read this Privacy Policy carefully. By using and accessing any of the Services, you agree to the collection, use, and disclosure of your information as described in this Privacy Policy. If you do not agree to this Privacy Policy, please do not use or access any of the Services.",
        ],
      },
      {
        heading: "Changes to this Privacy Policy",
        paras: [
          `We may update this Privacy Policy from time to time, including to reflect changes to our practices or for other operational, legal, or regulatory reasons. We will post the revised Privacy Policy on the Site and take any other steps required by applicable law.`,
        ],
      },
      {
        heading: "How we collect and use your personal information",
        paras: [
          "To provide the Services, we collect personal information about you from a variety of sources, as set out below. The information that we collect and use varies depending on how you interact with us.",
          "In addition to the specific uses set out below, we may use information we collect about you to communicate with you, provide or improve our Services, comply with any applicable legal obligations, enforce any applicable terms of service, and to protect or defend the Services, our rights, and the rights of our users or others.",
        ],
      },
      {
        heading: "Information we collect directly from you",
        paras: [
          "Contact details including your name, address, phone number, and email.",
          "Order information including your name, billing address, shipping address, payment confirmation, email address, and phone number.",
          "Customer support information including the information you choose to include in communications with us, for example, when sending a message through the Services.",
        ],
      },
      {
        heading: "Information we collect about your usage",
        paras: [
          `We may also automatically collect certain information about your interaction with the Services ("Usage Data"). To do this, we may use cookies, pixels, and similar technologies ("Cookies"). Usage Data may include information about how you access and use our Site and your account, including device information, browser information, information about your network connection, your IP address, and other information regarding your interaction with the Services.`,
        ],
      },
      {
        heading: "How we use your personal information",
        paras: [
          "Providing products and services: We use your personal information to provide you with the Services in order to perform our contract with you, including processing your payments, fulfilling your orders, sending notifications related to your account, purchases, returns, exchanges, and other transactions.",
          "Marketing and advertising: We may use your personal information for marketing and promotional purposes, such as to send marketing, advertising, and promotional communications by email, text message, or postal mail, and to show you advertisements for products or services.",
          "Security and fraud prevention: We use your personal information to detect, investigate or take action regarding possible fraudulent, illegal, or malicious activity.",
          "Communicating with you and service improvement: We use your personal information to provide you with customer support and improve our Services.",
        ],
      },
      {
        heading: "How we disclose personal information",
        paras: [
          "In certain circumstances, we may disclose your personal information to third parties for contract fulfillment purposes, legitimate purposes, and other reasons subject to this Privacy Policy.",
        ],
      },
      {
        heading: "Third-party websites and links",
        paras: [
          "Our Site may provide links to websites or other online platforms operated by third parties. If you follow links to sites not affiliated or controlled by us, you should review their privacy and security policies and other terms and conditions.",
        ],
      },
      {
        heading: "Children's data",
        paras: [
          "The Services are not intended to be used by children, and we do not knowingly collect any personal information about children.",
        ],
      },
      {
        heading: "Security and retention of your information",
        paras: [
          "Please be aware that no security measures are perfect or impenetrable, and we cannot guarantee “perfect security.”",
        ],
      },
      {
        heading: "Your rights",
        paras: [
          "Depending on where you live, you may have some or all of the rights listed below in relation to your personal information. You can ask us to delete your data at any time by writing to info@printscompany.in.",
        ],
      },
      {
        heading: "Contact",
        paras: [
          "Should you have any questions about our privacy practices or this Privacy Policy, or if you would like to exercise any of the rights available to you, please email us at info@printscompany.in.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of service",
    sections: [
      {
        paras: [
          `${BRAND_NAME} makes available information and materials on its website printscompany.in subject to the following terms and conditions ("Terms of Service"). Your use of printscompany.in constitutes your agreement to follow and be bound by these Terms of Service. If you do not agree to the Terms of Service, you may not use the site. ${BRAND_NAME} reserves the right to change these Terms of Service periodically without prior notice.`,
        ],
      },
      {
        heading: "Contact",
        paras: ["For queries, you can connect with us at info@printscompany.in."],
      },
      {
        heading: "Domestic shipping",
        paras: [
          "All orders are usually shipped within 5–7 working days (unless otherwise noted in the product description section), so you can expect delivery within 7–10 days. A tracking link will be sent to your inbox once your order is shipped; please allow 24 hours for tracking status updates.",
          "If the delivery address is challenging to access, delivery time may exceed our estimate. We may contact you via the email or phone number you provided to confirm the delivery address.",
          `We use reliable courier companies and/or Speed Post. ${BRAND_NAME} is not liable for delays by the courier company or Speed Post or for factors outside of ${BRAND_NAME}'s control. We will strive to ensure the timely delivery of your order within the estimated timeframe as noted in the order confirmation.`,
          `In the unlikely event that delivery is not possible for reasons outside ${BRAND_NAME}'s control, including poor courier services in your area, inaccessible delivery locations, or force majeure events, we will inform you and cancel your order, followed by a full refund.`,
        ],
      },
      {
        heading: "Return / refund / replacement",
        paras: [`${BRAND_NAME} does not accept any type of return.`],
      },
      {
        heading: "Cancellation",
        paras: ["Since each print is made-to-order, we do not accept any cancellation requests."],
      },
      {
        heading: "Processing orders",
        paras: [
          "Our business hours are 10:00 AM to 6:00 PM Indian Standard Time (IST) Monday through Friday. For any queries, write to us at info@printscompany.in, and we will respond as soon as possible.",
        ],
      },
      {
        heading: "Jurisdiction",
        paras: ["All disputes are subject to the courts of Karnataka jurisdiction."],
      },
      {
        heading: "Legal information",
        paras: [
          `All design and content featured on printscompany.in — including navigational buttons, images, artwork, graphics, photography, and text, are copyrights and trademarks owned by ${BRAND_NAME}, intended solely for personal, non-commercial use. Unauthorized reproduction or use is prohibited.`,
        ],
      },
      {
        heading: "Limitation of liability",
        paras: [
          `${BRAND_NAME} does not warrant uninterrupted or error-free operation of this website. Users are responsible for any costs associated with using our website. ${BRAND_NAME} shall not be liable for damages related to your use of or inability to access the website.`,
        ],
      },
      {
        heading: "Inaccuracies",
        paras: [
          `We strive to present accurate information but may occasionally have typographical errors or inaccuracies. We reserve the right to correct any errors or update information at any time. If a product is listed at an incorrect price, ${BRAND_NAME} reserves the right to cancel orders placed for that product. In such cases, we will issue a credit to your account if payment has been processed.`,
        ],
      },
      {
        heading: "Availability, product information, pricing & colors",
        paras: [
          "Many items are offered in limited quantities, and once sold out, they may not return to stock. We attempt to display product colors accurately but cannot guarantee they match the display on your monitor.",
        ],
      },
      {
        heading: "Indemnification",
        paras: [
          `You agree to indemnify ${BRAND_NAME}, its employees, and agents from losses or damages resulting from any violation of these terms by you or anyone accessing the site through your account.`,
        ],
      },
      {
        heading: "Correspondence",
        paras: [
          `${BRAND_NAME} is under no obligation to respond to all correspondence or maintain confidentiality for comments submitted through this site.`,
        ],
      },
      {
        heading: "Contact us",
        paras: ["We welcome questions, feedback, and ideas. You can reach us at info@printscompany.in."],
      },
    ],
  },
  contact: {
    title: "Contact",
    sections: [
      {
        paras: [
          "The fastest way to reach us is email — info@printscompany.in — and the photographer answers personally, usually within a day.",
          "For questions about a live order, include your order number (it starts with PC- or FP-).",
        ],
      },
    ],
  },
};

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export function policyMetadata(key: PolicyKey): Metadata {
  const doc = policyDocs[key];
  const tab = policyTabs.find((t) => t.key === key)!;
  const description = truncate(doc.sections[0].paras[0], 155);
  const url = `${SITE_URL}${tab.href}`;

  return {
    title: doc.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${doc.title} | ${BRAND_NAME}`,
      description,
      url,
      siteName: BRAND_NAME,
      type: "website",
    },
  };
}
