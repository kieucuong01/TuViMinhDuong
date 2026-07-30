import type { NextConfig } from "next";
import { LEGACY_ARTICLE_REDIRECTS } from "./src/lib/legacy-article-redirects";

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.googleadservices.com https://googleads.g.doubleclick.net",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://googleads.g.doubleclick.net",
      "frame-src https://www.googletagmanager.com https://td.doubleclick.net",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1"],
  async redirects() {
    return [...LEGACY_ARTICLE_REDIRECTS];
  },
  async headers() {
    const publicSeoCacheHeader = {
      key: "Cache-Control",
      value: "public, s-maxage=300, stale-while-revalidate=31536000",
    };

    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/", headers: [publicSeoCacheHeader] },
      { source: "/kien-thuc-tu-vi", headers: [publicSeoCacheHeader] },
      { source: "/xem-ngay", headers: [publicSeoCacheHeader] },
      { source: "/pricing", headers: [publicSeoCacheHeader] },
      { source: "/lien-he", headers: [publicSeoCacheHeader] },
    ];
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
