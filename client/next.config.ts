import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://api-dev:3000/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
