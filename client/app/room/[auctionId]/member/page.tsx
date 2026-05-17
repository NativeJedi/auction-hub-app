'use client';

import BidController from '@/app/room/[auctionId]/member/BidContoller';
import ControlFooter from '@/app/room/[auctionId]/member/ControlFooter';
import { useAuctionId } from '@/app/room/[auctionId]/hooks';
import {
  MemberRoomProvider,
  useMemberRoomContext,
} from '@/src/modules/room-engine/member/MemberRoomContext';
import RoomHeader from '@/app/room/[auctionId]/components/RoomHeader';
import CurrentLot from '@/app/room/[auctionId]/components/CurrentLot';
import Bids from '@/app/room/[auctionId]/components/Bids';
import { RoomErrorBoundary } from '@/app/room/[auctionId]/components/RoomErrorBoundary';

const RoomMemberPage = () => {
  const {
    state: { isLoading, bids, auction, activeLot },
  } = useMemberRoomContext();

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-muted/30">
      <RoomHeader isLoading={isLoading} title={auction?.name} description={auction?.description} />

      <main className="flex-1 overflow-y-auto pb-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col gap-3 p-3 max-w-lg mx-auto">
          <BidController />

          <CurrentLot isLoading={isLoading} lot={activeLot} />

          <Bids isLoading={isLoading} bids={bids} />
        </div>
      </main>

      <ControlFooter />
    </div>
  );
};

const MemberPage = () => {
  const auctionId = useAuctionId();
  return (
    <RoomErrorBoundary>
      <MemberRoomProvider auctionId={auctionId}>
        <RoomMemberPage />
      </MemberRoomProvider>
    </RoomErrorBoundary>
  );
};

export default MemberPage;
