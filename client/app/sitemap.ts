import type { MetadataRoute } from 'next';

const siteOrigin = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'http://localhost:3001';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteOrigin}/`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];
}
