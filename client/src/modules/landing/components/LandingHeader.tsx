import Link from 'next/link';

import { Button } from '@/ui-kit/ui/button';
import Logo from '@/src/components/Logo';

interface LandingHeaderProps {
  isAuthenticated: boolean;
}

export default function LandingHeader({ isAuthenticated }: LandingHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Logo href="/" />

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a
            href="#how"
            className="rounded-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            How it works
          </a>
          <a
            href="#features"
            className="rounded-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Features
          </a>
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Button asChild size="sm">
              <Link href="/crm/auctions">Go to dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/crm/auth">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/crm/auth?type=register">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
