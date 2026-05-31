import { Card } from '@/ui-kit/ui/card';

const STEPS = [
  {
    title: 'Create auction',
    description: 'Set up a new auction and name your sale.',
  },
  {
    title: 'Add lots',
    description: 'List the items, photos, and starting prices.',
  },
  {
    title: 'Start auction',
    description: 'Open the sale to bring the room live.',
  },
  {
    title: 'Invite bidders',
    description: 'Show a QR code on the Invite screen for people in the room to scan and join.',
  },
  {
    title: 'Manage live bidding',
    description:
      'Watch bids land from the room. When a bid is high enough, move on to the next lot.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="border-y bg-muted">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="mb-10 text-center">
          <h2 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">
            How an auction works
          </h2>
          <p className="text-muted-foreground">Five steps to run the room.</p>
        </div>

        <ol className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))]">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <Card className="h-full p-6">
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <h3 className="mb-1.5 mt-4 text-base font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </Card>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
