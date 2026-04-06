'use client';
import RoomHeader from '@/app/room/[roomId]/RoomHeader';
import CurrentLot from '@/app/room/[roomId]/CurrentLot';
import RoomCard from '@/app/room/[roomId]/RoomCard';
import Bids from '@/app/room/[roomId]/Bids';

const MOCK_AUCTION = {
  name: 'Modern Art Collection',
  description: 'Spring 2025',
  lotIndex: 2,
  totalLots: 10,
};

const MOCK_ACTIVE_LOT = {
  name: 'Vase No. 12, 1987',
  description:
    'A rare late-period piece by the renowned ceramicist Borys Mykhailenko. Wheel-thrown stoneware with hand-applied cobalt glaze.',
  startPrice: '8 000 ₴',
  images: [],
};

const MOCK_BIDS = [
  { id: '1', name: 'Dmytro P.', amount: '11 000 ₴' },
  { id: '2', name: 'Olena K.', amount: '9 500 ₴' },
  { id: '3', name: 'Dmytro P.', amount: '8 500 ₴' },
  { id: '4', name: 'Ivan V.', amount: '8 000 ₴' },
  { id: '5', name: 'Maria H.', amount: '7 500 ₴' },
];

// ─── QR placeholder SVG ───────────────────────────────────────────────────────

const QrPlaceholder = () => (
  <svg
    viewBox="0 0 90 90"
    xmlns="http://www.w3.org/2000/svg"
    className="w-4/5 h-4/5 max-w-[140px] max-h-[140px]"
  >
    <rect
      x="5"
      y="5"
      width="28"
      height="28"
      rx="3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    />
    <rect x="11" y="11" width="16" height="16" rx="1" fill="currentColor" />
    <rect
      x="57"
      y="5"
      width="28"
      height="28"
      rx="3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    />
    <rect x="63" y="11" width="16" height="16" rx="1" fill="currentColor" />
    <rect
      x="5"
      y="57"
      width="28"
      height="28"
      rx="3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    />
    <rect x="11" y="63" width="16" height="16" rx="1" fill="currentColor" />
    <rect x="42" y="5" width="6" height="6" rx="1" fill="currentColor" />
    <rect x="42" y="13" width="6" height="6" rx="1" fill="currentColor" />
    <rect x="42" y="21" width="6" height="6" rx="1" fill="currentColor" />
    <rect x="5" y="42" width="6" height="6" rx="1" fill="currentColor" />
    <rect x="13" y="42" width="6" height="6" rx="1" fill="currentColor" />
    <rect x="21" y="42" width="6" height="6" rx="1" fill="currentColor" />
    <rect x="42" y="42" width="6" height="6" rx="1" fill="currentColor" />
    <rect x="50" y="42" width="6" height="6" rx="1" fill="currentColor" />
    <rect x="58" y="42" width="6" height="6" rx="1" fill="currentColor" />
    <rect x="66" y="42" width="6" height="6" rx="1" fill="currentColor" />
    <rect x="74" y="42" width="6" height="6" rx="1" fill="currentColor" />
    <rect x="42" y="50" width="6" height="6" rx="1" fill="currentColor" />
    <rect x="58" y="50" width="6" height="6" rx="1" fill="currentColor" />
    <rect x="74" y="50" width="6" height="6" rx="1" fill="currentColor" />
    <rect x="42" y="58" width="6" height="6" rx="1" fill="currentColor" />
    <rect x="50" y="58" width="6" height="6" rx="1" fill="currentColor" />
    <rect x="66" y="58" width="6" height="6" rx="1" fill="currentColor" />
    <rect x="42" y="66" width="6" height="6" rx="1" fill="currentColor" />
    <rect x="58" y="66" width="6" height="6" rx="1" fill="currentColor" />
    <rect x="42" y="74" width="6" height="6" rx="1" fill="currentColor" />
    <rect x="50" y="74" width="6" height="6" rx="1" fill="currentColor" />
    <rect x="66" y="74" width="6" height="6" rx="1" fill="currentColor" />
    <rect x="74" y="74" width="6" height="6" rx="1" fill="currentColor" />
  </svg>
);

const RoomDisplayPage = () => (
  <div className="h-screen flex flex-col bg-muted/30 overflow-y-auto md:overflow-hidden">
    <RoomHeader title={MOCK_AUCTION.name} description={MOCK_AUCTION.description} />

    {/* Mobile: flex-col scroll; md+: 2-column grid fixed height */}
    <div className="flex-1 flex flex-col gap-3 p-3 md:grid md:grid-cols-[4fr_3fr] md:min-h-0">
      <CurrentLot
        tool={
          <span className="text-xs font-medium bg-muted border rounded-full px-2 py-0.5 text-muted-foreground">
            {MOCK_AUCTION.lotIndex} / {MOCK_AUCTION.totalLots}
          </span>
        }
        lot={MOCK_ACTIVE_LOT}
      />

      {/* Mobile: stack QR + Bids; md+: 2-row grid */}
      <div className="flex flex-col gap-3 md:grid md:grid-rows-2 md:min-h-0">
        <RoomCard title="Join auction">
          <div className="h-40 md:h-auto md:flex-1 md:min-h-0 w-full bg-muted rounded-md flex items-center justify-center">
            <QrPlaceholder />
          </div>
          <p className="text-sm font-medium text-center">Scan to join</p>
        </RoomCard>

        <Bids bids={MOCK_BIDS} />
      </div>
    </div>
  </div>
);

export default RoomDisplayPage;
