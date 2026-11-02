import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["react", "react-dom"],
    // Faster client nav: keep server responses fresh-but-instant
    staleTimes: { dynamic: 30, static: 180 },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
  },
  async headers() {
    return [
      {
        source: "/api/techniques",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=120, stale-while-revalidate=600" }],
      },
      {
        source: "/api/stats",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=60, stale-while-revalidate=300" }],
      },
      {
        source: "/api/agent",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=60, stale-while-revalidate=300" }],
      },
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|woff2)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
