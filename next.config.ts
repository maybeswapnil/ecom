import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    // Server Actions default to a 1MB body limit — too small for the product
    // image upload action, which validates files up to 10MB itself.
    serverActions: {
      bodySizeLimit: "10mb",
    },
    // Requests also pass through proxy.ts, which has its own separate body
    // size cap (distinct from serverActions.bodySizeLimit above).
    proxyClientMaxBodySize: "10mb",
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
