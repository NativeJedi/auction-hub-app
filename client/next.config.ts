import type { NextConfig } from 'next';

const storageUrl = new URL(process.env.STORAGE_PUBLIC_URL ?? 'http://localhost:9000');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: storageUrl.protocol.replace(':', '') as 'http' | 'https',
        hostname: storageUrl.hostname,
        port: storageUrl.port,
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
