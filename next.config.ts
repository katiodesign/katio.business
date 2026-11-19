import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  poweredByHeader: false,
  ...(process.env.KATIO_INTEGRATION === "1" ? { distDir: ".next-integration" } : {}),
  experimental: { serverActions: { bodySizeLimit: "11mb" }, authInterrupts: true },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
      ],
    }];
  },
};
export default nextConfig;
