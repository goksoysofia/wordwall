import type { NextConfig } from "next";

const securityHeaders = [
  // Block MIME-type sniffing.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Don't leak full URLs to third parties.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable powerful features the app doesn't use.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Legacy clickjacking protection (CSP frame-ancestors is the modern equivalent).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
