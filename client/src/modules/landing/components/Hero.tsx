import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/ui-kit/ui/button';
import { Badge } from '@/ui-kit/ui/badge';

export default function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-14 pt-18 text-center">
      <Badge className="mb-5 gap-1.5 rounded-full border bg-muted px-3 py-1 font-medium text-muted-foreground">
        <span className="size-2 rounded-full bg-success" aria-hidden="true" />
        For live, in-person auctions
      </Badge>

      <h1 className="mx-auto mb-4 max-w-4xl font-bold leading-tight tracking-tight">
        <span className="mb-1 block text-xl font-semibold text-primary">AuctionHub</span>
        <span className="block text-3xl sm:text-4xl">Capture every bid in the room.</span>
        <span className="block text-2xl sm:text-3xl">No raised hands, no lost money.</span>
      </h1>

      <div className="mx-auto mb-8 max-w-2xl space-y-3 text-base text-muted-foreground sm:text-lg">
        <p>
          Waving hands and shouting bids is uncomfortable and easy to miss — and those bids walk out
          with the money.
        </p>
        <p>
          AuctionHub lets everyone bid from their phone in one tap,
          <br />
          while you run every lot from one screen.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/crm/auth?type=register">
            Create your first auction
            <ArrowRight />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
          <Link href="/crm/auth">I already have an account</Link>
        </Button>
      </div>
    </section>
  );
}
