import type { MetadataRoute } from 'next';

const siteOrigin = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'http://localhost:3001';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Keep functional / private routes out of the index: auth & email-confirmation
      // are not search content; room & results are per-auction, token-gated and dynamic.
      disallow: ['/crm', '/room', '/results', '/confirm-email'],
    },
    sitemap: `${siteOrigin}/sitemap.xml`,
  };
}
