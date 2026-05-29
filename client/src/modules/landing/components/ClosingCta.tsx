import Link from 'next/link';

import { Button } from '@/ui-kit/ui/button';

export default function ClosingCta() {
  return (
    <section className="border-t bg-muted">
      <div className="mx-auto max-w-2xl px-5 py-14 text-center">
        <h2 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">
          Ready to run your next auction?
        </h2>
        <p className="mb-7 text-muted-foreground">
          Set up your first auction in minutes — it&apos;s free to start.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/crm/auth?type=register">Get started</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href="/crm/auth">Log in</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
