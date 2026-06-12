import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    inlineCss: true,
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
