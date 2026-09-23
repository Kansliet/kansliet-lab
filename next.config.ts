import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1400, 1920, 2048],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year — portfolio images never change
    // Remote store product images. Fetched server-side by the image
    // optimizer and served from /_next/image, so CSP img-src 'self' covers
    // them. Add a host here before pointing image_url at it.
    remotePatterns: [{ protocol: "https", hostname: "files.stripe.com" }],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Content-Security-Policy",
            // Note: 'unsafe-inline' for scripts is required by Next.js inline bootstrapping.
            // For a stricter policy, use a nonce via middleware (next.config nonce support).
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://www.google-analytics.com`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://www.google-analytics.com",
              "font-src 'self'",
              "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.g.doubleclick.net",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;