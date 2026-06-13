import type { NextConfig } from 'next';

const storageUrl = new URL(process.env.STORAGE_PUBLIC_URL ?? 'http://localhost:9000');
const clientUrl = new URL(process.env.CLIENT_URL ?? 'http://localhost:3001');
const serverOrigin = `${clientUrl.protocol}//${clientUrl.hostname}:3000`;
const wsServerOrigin = `ws://${clientUrl.hostname}:3000`;

const isProd = process.env.NODE_ENV === 'production';

// CSP scoped to Google Identity Services + the storage origin for images.
// 'unsafe-inline' / 'unsafe-eval' on script-src are still required by Next's
// dev runtime and RSC hydration; switch to nonce-based CSP if a stricter
// policy is adopted project-wide.
const cspDirectives = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' ${isProd ? '' : "'unsafe-eval'"} https://accounts.google.com/gsi/client`,
  `style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style`,
  `img-src 'self' data: blob: ${storageUrl.origin} https://*.amazonaws.com https://*.cloudfront.net https://*.googleusercontent.com`,
  `font-src 'self' data:`,
  // connect-src must allow presigned PUT uploads (S3: bucket.s3.<region>.amazonaws.com)
  // and reads/fetches via CloudFront. Wildcards are used because the exact bucket /
  // distribution host isn't known at build time (headers() is computed during next build).
  `connect-src 'self' https://accounts.google.com/gsi/ ${storageUrl.origin} https://*.amazonaws.com https://*.cloudfront.net ${isProd ? `${serverOrigin} ${wsServerOrigin}` : 'ws: wss:'}`,
  `frame-src https://accounts.google.com/`,
  `frame-ancestors 'self'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: cspDirectives },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ...(isProd
    ? [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload',
        },
      ]
    : []),
];

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
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(nextConfig);
