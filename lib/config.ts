// Config constants — SPEC.md §12
// Shipping values are FALLBACK DEFAULTS only since 014_offers.sql: the live values come from
// company_settings.shipping_flat_paise and the active 'free_shipping' row in offers
// (lib/offers.ts). Used when the DB read fails (fail-closed: charge shipping) and as the
// client's optimistic initial state while /api/offers/shipping loads.
export const SHIPPING_FLAT_PAISE = 14900; // ₹149
export const EXPRESS_SHIPPING_PAISE = 34900; // ₹349
export const FREE_SHIP_THRESHOLD_PAISE = 750000; // ₹7,500
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

/** Bundled fallback for the home-page hero when no image is set in admin settings. */
export const DEFAULT_HERO_IMAGE = "/images/hero-framed-print.jpg";

export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/hellochemo/",
  pexels: "https://www.pexels.com/@hellochemo/",
};
