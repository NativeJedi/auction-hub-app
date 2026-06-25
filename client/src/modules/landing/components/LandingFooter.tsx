'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/ui-kit/utils';

const LINKS = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
];

// Shared focus ring, matching the convention used by the shadcn Button
// (focus-visible + --ring token). Kept visible for keyboard users.
const focusRing =
  'rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export default function LandingFooter() {
  const pathname = usePathname();

  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-6 text-xs text-muted-foreground">
        <span>© 2026 AuctionHub</span>
        <nav className="flex items-center gap-4">
          {LINKS.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'transition-colors',
                  focusRing,
                  isActive ? 'font-medium text-primary' : 'hover:text-primary'
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </footer>
  );
}
