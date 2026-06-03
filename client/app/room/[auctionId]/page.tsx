'use client';

import QRCode from 'react-qr-code';
import { useEffect, useState } from 'react';
import RoomHeader from './components/RoomHeader';
import CurrentLot from './components/CurrentLot';
import RoomCard from './components/RoomCard';
import Bids from './components/Bids';
import { useAuctionId } from '@/app/room/[auctionId]/hooks';
import { RoomErrorBoundary } from './components/RoomErrorBoundary';
import { PublicRoomProvider } from '@/src/modules/room-engine/public/PublicRoomContext';
import { usePublicRoom } from '@/src/modules/room-engine/public/hooks/usePublicRoom';

const useInviteUrl = () => {
  const auctionId = useAuctionId();
  const [url, setUrl] = useState('');

  useEffect(() => {
    setUrl(`${window.location.origin}/room/${auctionId}/invite`);
  }, [auctionId]);

  return url;
};

const RoomDisplayPage = () => {
  const { isLoading, auction, activeLot, bids } = usePublicRoom();

  const inviteUrl = useInviteUrl();

  return (
    <div className="h-screen flex flex-col bg-muted/30 overflow-y-auto md:overflow-hidden">
      <RoomHeader isLoading={isLoading} title={auction?.name} description={auction?.description} />

      <div className="flex-1 flex flex-col gap-3 p-3 md:grid md:grid-cols-[4fr_3fr] md:min-h-0">
        <CurrentLot isLoading={isLoading} lot={activeLot} />

        <div className="flex flex-col gap-3 md:grid md:grid-rows-2 md:min-h-0">
          <RoomCard title="Join auction">
            <div className="h-40 md:h-auto md:flex-1 md:min-h-0 w-full bg-white rounded-md flex items-center justify-center">
              {inviteUrl && <QRCode value={inviteUrl} size={140} fgColor="#000000" bgColor="#ffffff" />}
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
  const auctionId = useAuctionId();
  return (
    <RoomErrorBoundary>
      <PublicRoomProvider auctionId={auctionId}>
        <RoomDisplayPage />
      </PublicRoomProvider>
    </RoomErrorBoundary>
  );
};

export default RoomPage;
