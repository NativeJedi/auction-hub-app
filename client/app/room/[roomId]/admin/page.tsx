'use client';

import { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui-kit/ui/button';
import { Badge } from '@/ui-kit/ui/badge';

import {
  RoomAdminInfoResponseDto,
  RoomBid,
  RoomInvite,
  RoomLot,
  RoomMember,
} from '@/src/api/dto/room.dto';
import RoomHeader from '@/app/room/[roomId]/RoomHeader';
import RoomBids from '@/app/room/[roomId]/RoomBids';
import BaseSocket from '@/src/sockets/base-socket';
import { getRoomToken } from '@/src/utils/local-storage';
import { useErrorNotification } from '@/src/modules/notifications/NotifcationContext';
import { useRoomId } from '@/app/room/[roomId]/hooks';
import { AppClientConfig } from '@/config/client';
import { fetchAdminRoomInfo } from '@/src/api/auctions-api-client/requests/room';
import RoomSection from '@/app/room/[roomId]/RoomSection';
import CopyInviteLink from '@/app/room/[roomId]/admin/CopyInviteLink';
import RoomCard from '@/app/room/[roomId]/RoomCard';
import RoomLotInfo from '@/app/room/[roomId]/RoomLotInfo';

const roomSocket = new BaseSocket(AppClientConfig.NEXT_PUBLIC_API_WEBSOCKET_URL);

const connectRoomSocket =
  ({
    onFinish,
    onInvite,
    onMember,
    onLot,
    onBid,
    onError,
  }: {
    onFinish: () => void;
    onInvite: (invite: RoomInvite) => void;
    onMember: (member: RoomMember) => void;
    onLot: (lot: RoomLot) => void;
    onBid: (bid: RoomBid) => void;
    onError: (error: Error) => void;
  }) =>
  (token: string) => {
    roomSocket.connect(token);
    roomSocket.onEvent<RoomLot>('newLot', onLot);
    roomSocket.onEvent<RoomLot>('auctionFinished', onFinish);
    roomSocket.onEvent<RoomInvite>('newInvite', onInvite);
    roomSocket.onEvent<RoomBid>('newBid', onBid);
    roomSocket.onEvent<RoomMember>('newMember', onMember);
    roomSocket.onError(onError);
  };

const useRoom = () => {
  const [roomInfo, setRoomInfo] = useState<RoomAdminInfoResponseDto>();
  const [activeLot, setActiveLot] = useState<RoomLot>();
  const [activeLotBids, setActiveLotBids] = useState<RoomBid[]>([]);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [invites, setInvites] = useState<RoomMember[]>([]);

  const roomId = useRoomId();
  const router = useRouter();
  const onError = useErrorNotification();

  const onMember = (member: RoomMember) => {
    setMembers((prev) => [...prev, member]);
    setInvites((prev) => prev.filter((i) => i.id !== member.id));
  };

  const onInvite = (invite: RoomMember) => setInvites((prev) => [...prev, invite]);
  const onBid = (bid: RoomBid) => setActiveLotBids((prev) => [...prev, bid]);
  const onLot = (lot: RoomLot) => {
    setActiveLot(lot);
    setActiveLotBids([]);
  };

  useEffect(() => {
    const token = getRoomToken(roomId);
    if (!token) {
      router.replace('/crm/auctions');
      return;
    }

    fetchAdminRoomInfo({ roomId })
      .then((resp) => {
        setRoomInfo(resp);
        setActiveLot(resp.activeLot);
        setActiveLotBids(resp.activeLotBids);
        setMembers(resp.members);
        setInvites(resp.invites);

        connectRoomSocket({
          onMember,
          onInvite,
          onBid,
          onLot,
          onError,
          onFinish: () => router.push(`/crm/auctions/${resp.room.auction.id}`),
        })(token);
      })
      .catch(onError);

    return () => roomSocket.disconnect();
  }, []);

  const lots = roomInfo?.lots || [];
  const activeLotCurrentBid = activeLotBids?.[activeLotBids.length - 1] || activeLotBids[0];

  const isLastLot = useMemo(() => {
    if (!activeLot) return true;
    const index = lots.findIndex((lot) => lot.id === activeLot.id);
    return index === lots.length - 1;
  }, [activeLot, lots]);

  const switchLot = () => {
    if (isLastLot) roomSocket.emitEvent('finishAuction');
    else roomSocket.emitEvent('placeLot');
  };

  return {
    roomInfo,
    activeLot,
    activeLotCurrentBid,
    activeLotBids,
    members,
    invites,
    isLastLot,
    switchLot,
  };
};

const ConditionField = ({
  condition,
  label,
  children,
}: PropsWithChildren<{ condition: boolean; label: string }>) => {
  if (!condition) {
    return <p>{label}: -</p>;
  }

  return (
    <p>
      {label}: <span className="text-primary font-bold">{children}</span>
    </p>
  );
};

const RoomAdminPage = () => {
  const {
    roomInfo,
    activeLot,
    activeLotCurrentBid,
    activeLotBids,
    members,
    invites,
    isLastLot,
    switchLot,
  } = useRoom();

  if (!roomInfo || !activeLot) return null;

  const currency = activeLot.currency;

  return (
    <div className="p-6 h-screen flex flex-col space-y-6">
      <RoomHeader
        title={roomInfo.room.auction.name}
        description={roomInfo.room.auction.description}
        action={<CopyInviteLink roomId={roomInfo.room.id} />}
      />

      <main className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
        <div className="flex flex-col gap-6 h-full">
          <RoomSection
            title="Active lot"
            action={
              <Button variant="default" onClick={switchLot}>
                {isLastLot ? 'Finish auction' : 'Next lot'}
              </Button>
            }
          >
            <RoomLotInfo lot={activeLot}>
              <ConditionField label="Current bid" condition={!!activeLotCurrentBid}>
                {`${activeLotCurrentBid?.amount} ${currency}`}
              </ConditionField>
              <ConditionField label="By" condition={!!activeLotCurrentBid}>
                {activeLotCurrentBid?.name}
              </ConditionField>
            </RoomLotInfo>
          </RoomSection>
        </div>

        <div className="flex flex-col gap-6 h-full">
          <RoomSection title="Bids">
            <RoomBids currency={currency} bids={activeLotBids} />
          </RoomSection>
        </div>

        <div className="flex flex-col gap-6 h-full">
          <RoomSection title="Participants">
            <RoomCard>
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <span>{member.name}</span>
                  <Badge className="min-w-[82px]" variant="success" outline size="sm">
                    joined
                  </Badge>
                </div>
              ))}
              {invites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between">
                  <span>{invite.name}</span>
                  <Badge className="min-w-[82px]" variant="draft" outline size="sm">
                    invited
                  </Badge>
                </div>
              ))}
            </RoomCard>
          </RoomSection>
        </div>
      </main>
    </div>
  );
};

export default RoomAdminPage;
