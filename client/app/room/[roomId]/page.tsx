'use client';

import RoomHeader from './components/RoomHeader';
import CurrentLot from './components/CurrentLot';
import RoomCard from './components/RoomCard';
import Bids from './components/Bids';
import { useRoomId } from '@/app/room/[roomId]/hooks';
import { RoomErrorBoundary } from './components/RoomErrorBoundary';
import { PublicRoomProvider } from '@/src/modules/room-engine/public/PublicRoomContext';
import { usePublicRoom } from '@/src/modules/room-engine/public/hooks/usePublicRoom';

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

const RoomDisplayPage = () => {
  const { isLoading, auction, activeLot, bids } = usePublicRoom();

  return (
    <div className="h-screen flex flex-col bg-muted/30 overflow-y-auto md:overflow-hidden">
      <RoomHeader isLoading={isLoading} title={auction?.name} description={auction?.description} />

      <div className="flex-1 flex flex-col gap-3 p-3 md:grid md:grid-cols-[4fr_3fr] md:min-h-0">
        <CurrentLot isLoading={isLoading} lot={activeLot} />

        <div className="flex flex-col gap-3 md:grid md:grid-rows-2 md:min-h-0">
          <RoomCard title="Join auction">
            <div className="h-40 md:h-auto md:flex-1 md:min-h-0 w-full bg-muted rounded-md flex items-center justify-center">
              <QrPlaceholder />
            </div>
            <p className="text-sm font-medium text-center">Scan to join</p>
          </RoomCard>

          <Bids isLoading={isLoading} bids={bids} />
        </div>
      </div>
    </div>
  );
};

const RoomPage = () => {
  const roomId = useRoomId();
  return (
    <RoomErrorBoundary>
      <PublicRoomProvider roomId={roomId}>
        <RoomDisplayPage />
      </PublicRoomProvider>
    </RoomErrorBoundary>
  );
};

export default RoomPage;
