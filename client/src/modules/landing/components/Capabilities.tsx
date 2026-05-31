import { Zap, QrCode, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Card } from '@/ui-kit/ui/card';

const CAPABILITIES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Zap,
    title: 'Bid from your phone',
    description:
      'Quiet bidders place bids in a tap — no raising hands, no shouting. Every bid lands instantly.',
  },
  {
    icon: QrCode,
    title: 'QR code invites',
    description: 'Bidders join the auction in seconds by scanning the QR code shown on screen.',
  },
  {
    icon: Users,
    title: 'Buyers & CRM',
    description: 'Keep auctions, lots, and buyer records organized across every sale.',
  },
];

export default function Capabilities() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-5 py-14">
      <div className="mb-10 text-center">
        <h2 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">Built for live sales</h2>
        <p className="text-muted-foreground">Everything an organizer needs to run the room.</p>
      </div>

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(16rem,1fr))]">
        {CAPABILITIES.map(({ icon: Icon, title, description }) => (
          <Card key={title} className="p-6">
            <span className="inline-flex size-11 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="size-[22px]" />
            </span>
            <h3 className="mb-1.5 mt-4 text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
