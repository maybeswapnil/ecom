// Config constants — SPEC.md §12
export const SHIPPING_FLAT_PAISE = 14900; // ₹149, matches mockup shipOptions
export const EXPRESS_SHIPPING_PAISE = 34900; // ₹349
export const FREE_SHIP_THRESHOLD_PAISE = 750000; // ₹7,500, matches mockup FREE constant
export const MAX_QTY_PER_LINE = 10;
export const MAX_CART_LINES = 20;
export const PENDING_ORDER_TTL_HOURS = 24;
export const CONFIRMATION_POLL_SECONDS = 60;
export const LOW_STOCK_THRESHOLD = 2;
export const SERVICEABILITY_TIMEOUT_MS = 1500;
export const SERVICEABILITY_CACHE_HOURS = 24;
export const TRACKING_SWEEP_HOURS = 6;

export const BRAND_NAME = "Prints Company";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/hellochemo/",
  pexels: "https://www.pexels.com/@hellochemo/",
};
