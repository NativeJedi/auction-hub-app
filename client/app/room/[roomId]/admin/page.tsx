'use client';

import { Button } from '@/ui-kit/ui/button';
import { MonitorIcon, PowerIcon } from 'lucide-react';
import LotStrip, { StripLot } from './LotStrip';
import { useParams } from 'next/navigation';
import Bids from '@/app/room/[roomId]/Bids';
import Participants from '@/app/room/[roomId]/admin/Participants';
import RoomHeader from '@/app/room/[roomId]/RoomHeader';
import CurrentLot from '@/app/room/[roomId]/CurrentLot';

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_AUCTION = {
  name: 'Modern Art Collection',
  description: 'Spring 2025',
};

const MOCK_LOTS: StripLot[] = [
  { id: '1', name: 'Ceramic Bowl I', status: 'done', soldPrice: '9 200 ₴' },
  { id: '2', name: 'Vase No. 12, 1987', status: 'active' },
  { id: '3', name: 'Tapestry Blue', status: 'upcoming' },
  { id: '4', name: 'Bronze Figure', status: 'upcoming' },
  { id: '5', name: 'Print Series III', status: 'upcoming' },
  { id: '6', name: 'Watercolor No. 7', status: 'upcoming' },
  { id: '7', name: 'Marble Bust', status: 'upcoming' },
  { id: '8', name: 'Sketch Series IV', status: 'upcoming' },
  { id: '9', name: 'Abstract No. 3', status: 'upcoming' },
  { id: '10', name: 'Portrait 1965', status: 'upcoming' },
];

const MOCK_ACTIVE_LOT = {
  name: 'Vase No. 12, 1987',
  description:
    'A rare late-period piece by the renowned ceramicist Borys Mykhailenko. Wheel-thrown stoneware with hand-applied cobalt glaze. The form references traditional Hutsul pottery while the glaze treatment is distinctly modernist. Exhibited at the Kyiv State Museum of Decorative Arts in 1989 and 1993. Minor restoration to the foot ring, otherwise in excellent condition. Certificate of authenticity included.',
  startPrice: '8 000 ₴',
  images: [
    { id: '1', url: 'https://placehold.co/600x400?text=Front+view' },
    { id: '2', url: 'https://placehold.co/600x400?text=Side+view' },
    { id: '3', url: 'https://placehold.co/600x400?text=Detail' },
  ],
};

const MOCK_BIDS = [
  { id: '1', name: 'Dmytro P.', amount: '11 000 ₴', time: '1 min ago' },
  { id: '2', name: 'Olena K.', amount: '9 500 ₴', time: '2 min ago' },
  { id: '3', name: 'Dmytro P.', amount: '8 500 ₴', time: '3 min ago' },
  { id: '4', name: 'Ivan V.', amount: '8 000 ₴', time: '4 min ago' },
  { id: '5', name: 'Maria H.', amount: '8 000 ₴', time: '5 min ago' },
  { id: '6', name: 'Serhiy K.', amount: '7 500 ₴', time: '6 min ago' },
  { id: '7', name: 'Olena K.', amount: '7 000 ₴', time: '7 min ago' },
  { id: '8', name: 'Ivan V.', amount: '6 500 ₴', time: '8 min ago' },
  { id: '9', name: 'Dmytro P.', amount: '6 000 ₴', time: '9 min ago' },
  { id: '10', name: 'Maria H.', amount: '5 500 ₴', time: '10 min ago' },
  { id: '11', name: 'Yulia P.', amount: '5 000 ₴', time: '11 min ago' },
  { id: '12', name: 'Andriy B.', amount: '4 500 ₴', time: '12 min ago' },
];

const MOCK_MEMBERS = [
  { id: '1', name: 'Olena K.', status: 'joined' as const },
  { id: '2', name: 'Dmytro P.', status: 'joined' as const },
  { id: '3', name: 'Ivan V.', status: 'joined' as const },
  { id: '4', name: 'Maria H.', status: 'joined' as const },
  { id: '5', name: 'Yulia P.', status: 'joined' as const },
  { id: '6', name: 'Andriy B.', status: 'joined' as const },
  { id: '7', name: 'Larysa V.', status: 'joined' as const },
  { id: '8', name: 'Roman M.', status: 'joined' as const },
  { id: '9', name: 'Serhiy K.', status: 'pending' as const },
  { id: '10', name: 'Natalia B.', status: 'pending' as const },
  { id: '11', name: 'Halyna F.', status: 'pending' as const },
  { id: '12', name: 'Oleh D.', status: 'pending' as const },
  { id: '13', name: 'Iryna S.', status: 'pending' as const },
];

const RoomAdminPage = () => {
  const { roomId } = useParams<{ roomId: string }>();

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-muted/30">
      <RoomHeader title={MOCK_AUCTION.name} description={MOCK_AUCTION.description}>
        <Button variant="outline" asChild>
          <a href={`/room/${roomId}/display`} target="_blank" rel="noreferrer">
            <MonitorIcon className="size-3.5" />
            <span className="hidden sm:inline">Open display</span>
          </a>
        </Button>
        <Button variant="destructive">
          <PowerIcon className="size-3.5" />
          <span className="hidden sm:inline">Finish auction</span>
        </Button>
      </RoomHeader>

      <LotStrip lots={MOCK_LOTS} />

      <main className="flex-1 overflow-y-auto md:overflow-hidden p-3">
        <div className="flex flex-col gap-3 md:grid md:grid-cols-3 md:h-full">
          <CurrentLot tool={<Button size="sm">Next lot →</Button>} lot={MOCK_ACTIVE_LOT} />

          <Bids bids={MOCK_BIDS} />

          <Participants members={MOCK_MEMBERS} />
        </div>
      </main>
    </div>
  );
};

export default RoomAdminPage;
