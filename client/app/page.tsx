import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from '@/src/services/session/constants';
import LandingPage from '@/src/modules/landing/LandingPage';
import StructuredData from '@/src/components/StructuredData';

const siteOrigin = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'http://localhost:3001';

const title = 'AuctionHub — Capture every bid in the room';
const description =
  'AuctionHub lets everyone in a live, in-person auction bid from their phone in one tap. Run every lot from one screen and never miss a bid again.';

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title,
  description,
  alternates: { canonical: '/' },
  openGraph: {
    title,
    description,
    url: '/',
    siteName: 'AuctionHub',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
};

export default async function RootPage() {
  const requestCookies = await cookies();

  const sessionId = requestCookies.get(SESSION_COOKIE_NAME)?.value;
  const isAuthenticated = Boolean(sessionId);

  return (
    <>
      <StructuredData />
      <LandingPage isAuthenticated={isAuthenticated} />
    </>
  );
}
