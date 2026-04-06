'use client';

import { useState } from 'react';
import { Button } from '@/ui-kit/ui/button';
import RoomHeader from '@/app/room/[roomId]/RoomHeader';
import CurrentLot from '@/app/room/[roomId]/CurrentLot';
import Bids from '@/app/room/[roomId]/Bids';
import RoomCard from '@/app/room/[roomId]/RoomCard';

const MOCK_AUCTION = {
  name: 'Modern Art Collection',
  description: 'Spring 2025',
  lotIndex: 2,
  totalLots: 10,
};

const MOCK_ACTIVE_LOT = {
  name: 'Vase No. 12, 1987',
  description:
    'A rare late-period piece by the renowned ceramicist Borys Mykhailenko. Wheel-thrown stoneware with hand-applied cobalt glaze. The form references traditional Hutsul pottery while the glaze treatment is distinctly modernist.',
  startPrice: '8 000 ₴',
  images: [
    { id: '1', url: 'https://placehold.co/600x400?text=Front+view' },
    { id: '2', url: 'https://placehold.co/600x400?text=Side+view' },
    { id: '3', url: 'https://placehold.co/600x400?text=Detail' },
  ],
};

const LEADING_AMOUNT = 12500;
const CURRENCY = '₴';

const MOCK_BIDS = [
  { id: '1', name: 'You', amount: `12 500 ${CURRENCY}` },
  { id: '2', name: 'Dmytro P.', amount: `11 000 ${CURRENCY}` },
  { id: '3', name: 'You', amount: `9 500 ${CURRENCY}` },
  { id: '4', name: 'Dmytro P.', amount: `8 500 ${CURRENCY}` },
  { id: '5', name: 'Ivan V.', amount: `8 000 ${CURRENCY}` },
  { id: '6', name: 'Maria H.', amount: `7 500 ${CURRENCY}` },
  { id: '7', name: 'You', amount: `7 000 ${CURRENCY}` },
  { id: '8', name: 'Serhiy K.', amount: `6 500 ${CURRENCY}` },
];

type BidControllerProps = {
  value: number;
  onChange: React.Dispatch<React.SetStateAction<number>>;
};

const BidController = ({ value, onChange }: BidControllerProps) => {
  const delta = value - LEADING_AMOUNT;
  const increase = (step: number) => onChange((prev) => prev + step);

  return (
    <RoomCard title="Your bid">
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="size-2 rounded-full bg-success flex-shrink-0" />
        <span className="text-xs font-medium text-success">You're winning</span>
        <span className="ml-auto text-xs font-medium text-success">
          {LEADING_AMOUNT.toLocaleString()} {CURRENCY}
        </span>
      </div>

      <div className="bg-muted rounded-xl px-3.5 py-3 flex items-baseline justify-between flex-shrink-0">
        <span className="text-2xl font-medium">
          {value.toLocaleString()} {CURRENCY}
        </span>
        <span className="text-xs text-muted-foreground">
          +
          <span className="text-primary font-medium">
            {delta.toLocaleString()} {CURRENCY}
          </span>{' '}
          to current
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 flex-shrink-0">
        {[100, 500, 1000].map((step) => (
          <button
            key={step}
            onClick={() => increase(step)}
            className="h-10 rounded-xl border border-primary/20 bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            +{step.toLocaleString()}
          </button>
        ))}
      </div>
    </RoomCard>
  );
};

type PlaceBidFooterProps = {
  amount: number;
};

const PlaceBidFooter = ({ amount }: PlaceBidFooterProps) => (
  <footer className="bg-background border-t px-4 py-3 flex flex-col gap-1.5 flex-shrink-0">
    <div className="max-w-lg mx-auto w-full flex flex-col gap-1.5">
      <Button className="w-full h-12 text-sm rounded-xl" size="lg">
        Place bid · {amount.toLocaleString()} {CURRENCY}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Current leader: {LEADING_AMOUNT.toLocaleString()} {CURRENCY} · Your bid will be{' '}
        {amount.toLocaleString()} {CURRENCY}
      </p>
    </div>
  </footer>
);

const RoomMemberPage = () => {
  const [bidAmount, setBidAmount] = useState(LEADING_AMOUNT + 1000);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-muted/30">
      <RoomHeader
        title={MOCK_AUCTION.name}
        description={`${MOCK_AUCTION.description} · Lot ${MOCK_AUCTION.lotIndex} of ${MOCK_AUCTION.totalLots}`}
      />

      <main className="flex-1 overflow-y-auto pb-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col gap-3 p-3 max-w-lg mx-auto">
          <BidController value={bidAmount} onChange={setBidAmount} />

          <CurrentLot lot={MOCK_ACTIVE_LOT} />

          <Bids bids={MOCK_BIDS} />
        </div>
      </main>

      <PlaceBidFooter amount={bidAmount} />
    </div>
  );
};

export default RoomMemberPage;
