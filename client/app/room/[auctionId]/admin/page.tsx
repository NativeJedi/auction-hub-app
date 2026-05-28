'use client';

import { Button } from '@/ui-kit/ui/button';
import { Skeleton } from '@/ui-kit/ui/skeleton';
import { MonitorIcon, PowerIcon } from 'lucide-react';
import LotStrip from './LotStrip';
import Participants from '@/app/room/[auctionId]/admin/Participants';
import { useAuctionId } from '@/app/room/[auctionId]/hooks';
import { AdminRoomProvider } from '@/src/modules/room-engine/admin/AdminRoomContext';
import { useAdminRoom } from '@/src/modules/room-engine/admin/hooks/useAdminRoom';
import RoomHeader from '@/app/room/[auctionId]/components/RoomHeader';
import CurrentLot from '@/app/room/[auctionId]/components/CurrentLot';
import Bids from '@/app/room/[auctionId]/components/Bids';
import { RoomErrorBoundary } from '@/app/room/[auctionId]/components/RoomErrorBoundary';

const RoomAdminPage = () => {
  const { engine, isLoading, auction, activeLot, lots, bids, members, invites, isLastLot } =
    useAdminRoom();
  const auctionId = useAuctionId();

  const lotButton = isLoading ? (
    <Skeleton className="h-8 w-24 rounded-md" />
  ) : isLastLot ? (
    <Button size="sm" variant="destructive" onClick={() => engine.finishAuction()}>
      Finish lot
    </Button>
  ) : (
    <Button size="sm" onClick={() => engine.nextLot()} disabled={!activeLot}>
      Next lot →
    </Button>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-muted/30">
      <RoomHeader isLoading={isLoading} title={auction?.name} description={auction?.description}>
        <Button variant="outline" asChild>
          <a href={`/room/${auctionId}`} target="_blank" rel="noreferrer">
            <MonitorIcon className="size-3.5" />
            <span className="hidden sm:inline">Open display</span>
          </a>
        </Button>
        <Button variant="destructive" onClick={() => engine.finishAuction()}>
          <PowerIcon className="size-3.5" />
          <span className="hidden sm:inline">Finish auction</span>
        </Button>
      </RoomHeader>

      <LotStrip isLoading={isLoading} lots={lots} activeLotId={activeLot?.id} />

      <main className="flex-1 overflow-y-auto md:overflow-hidden p-3">
        <div className="flex flex-col gap-3 md:grid md:grid-cols-3 md:h-full">
          <CurrentLot isLoading={isLoading} tool={lotButton} lot={activeLot} />

          <Bids isLoading={isLoading} bids={bids} />

          <Participants isLoading={isLoading} members={members} invites={invites} />
        </div>
      </main>
    </div>
  );
};

const AdminPage = () => {
  const auctionId = useAuctionId();

  return (
    <RoomErrorBoundary>
      <AdminRoomProvider auctionId={auctionId}>
        <RoomAdminPage />
      </AdminRoomProvider>
    </RoomErrorBoundary>
  );
};

export default AdminPage;
