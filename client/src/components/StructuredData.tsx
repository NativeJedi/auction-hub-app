const siteOrigin = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'http://localhost:3001';

const description =
  'AuctionHub lets everyone in a live, in-person auction bid from their phone in one tap. Run every lot from one screen and never miss a bid again.';

// schema.org entity graph so Google understands "AuctionHub" as a brand and product,
// improving brand/navigational relevance and sitelink eligibility. `@id` links the
// nodes; logo points at the crawlable icon route (see /icon).
const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteOrigin}/#organization`,
      name: 'AuctionHub',
      url: siteOrigin,
      logo: `${siteOrigin}/icon`,
    },
    {
      '@type': 'WebSite',
      '@id': `${siteOrigin}/#website`,
      name: 'AuctionHub',
      url: siteOrigin,
      publisher: { '@id': `${siteOrigin}/#organization` },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'AuctionHub',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description,
      url: siteOrigin,
      publisher: { '@id': `${siteOrigin}/#organization` },
    },
  ],
};

export default function StructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
