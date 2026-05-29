import LandingHeader from '@/src/modules/landing/components/LandingHeader';
import Hero from '@/src/modules/landing/components/Hero';
import HowItWorks from '@/src/modules/landing/components/HowItWorks';
import Capabilities from '@/src/modules/landing/components/Capabilities';
import ClosingCta from '@/src/modules/landing/components/ClosingCta';
import LandingFooter from '@/src/modules/landing/components/LandingFooter';

interface LandingPageProps {
  isAuthenticated: boolean;
}

// The isAuthenticated flag is read server-side in app/page.tsx and threaded
// into the header so the CTAs adapt to auth state without a client round-trip.
export default function LandingPage({ isAuthenticated }: LandingPageProps) {
  return (
    <div className="min-h-screen">
      <LandingHeader isAuthenticated={isAuthenticated} />
      <main>
        <Hero />
        <HowItWorks />
        <Capabilities />
        <ClosingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
