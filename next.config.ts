import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    const publicSeoCacheHeader = {
      key: "Cache-Control",
      value: "public, s-maxage=300, stale-while-revalidate=31536000",
    };

    return [
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
