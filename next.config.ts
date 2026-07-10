import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
