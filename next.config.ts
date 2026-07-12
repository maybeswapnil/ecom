import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const SUPABASE_ORIGIN = "https://hizbkvkihsrkwtrofimm.supabase.co";

// PostHog is proxied through the /ingest rewrite below, so it's covered by 'self'.
// 'unsafe-inline' in script-src is required by Next.js hydration inline scripts (a
// nonce-based CSP needs per-request nonce plumbing through middleware — future work).
// Dev needs 'unsafe-eval' (eval source maps) and ws: (HMR websocket).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://checkout.razorpay.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://images.pexels.com ${SUPABASE_ORIGIN}`,
  "font-src 'self'",
  `connect-src 'self' ${SUPABASE_ORIGIN} https://api.razorpay.com https://checkout.razorpay.com https://lumberjack.razorpay.com${isDev ? " ws: wss:" : ""}`,
  "frame-src https://api.razorpay.com https://checkout.razorpay.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // PostHog's ingestion endpoints are POSTed to with a trailing slash (e.g. /i/v0/e/).
  // Next.js's default trailing-slash redirect (308) breaks that POST through the /ingest
  // rewrite below — sendBeacon/fetch can't transparently replay a POST body across a
  // redirect, so events are silently dropped. This opts out of that redirect entirely.
  skipTrailingSlashRedirect: true,
  turbopack: {
    root: __dirname,
  },
  experimental: {
    // Server Actions default to a 1MB body limit. Raised to match our real
    // ceiling (4mb) — Vercel serverless functions hard-cap request bodies at
    // 4.5MB platform-wide, which no Next.js config can override, so the
    // upload validation limit in product-actions.ts must stay under that.
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  // Trust the ngrok tunnel host in dev so HMR/websocket requests aren't rejected as cross-origin.
  allowedDevOrigins: ["mallard-subtle-grubworm.ngrok-free.app"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "hizbkvkihsrkwtrofimm.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  async redirects() {
    return [
      // Razorpay live-mode review expects policy pages at these conventional paths.
      { source: "/shipping-policy", destination: "/shipping", permanent: true },
      { source: "/terms-of-service", destination: "/terms", permanent: true },
      { source: "/privacy-policy", destination: "/privacy", permanent: true },
      { source: "/returns-policy", destination: "/refunds", permanent: true },
      { source: "/contact-us", destination: "/contact", permanent: true },
    ];
  },
};

export default nextConfig;
