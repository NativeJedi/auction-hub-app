import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import LandingFooter from '@/src/modules/landing/components/LandingFooter';

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

// Shared shell for the static legal pages (/privacy, /terms). Server component:
// the content is fully static, so there is nothing to hydrate.
export default function LegalLayout({ title, lastUpdated, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center px-5 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-sm text-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to AuctionHub
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>

        <div className="legal-prose mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
          {children}
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

// Small presentational helpers so the page files stay readable.
export function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{heading}</h2>
      {children}
    </section>
  );
}

export function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-muted-foreground">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
