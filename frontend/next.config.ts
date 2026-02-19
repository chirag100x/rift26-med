import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3080/api/:path*",
      },
    ];
  },
};

export default nextConfig;
