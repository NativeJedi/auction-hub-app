'use client';

import {
  RoomAdminInfoResponseDto,
  RoomBid,
  RoomInvite,
  RoomLot,
  RoomMember,
} from '@/src/api/dto/room.dto';
import RoomHeader from '@/app/room/[roomId]/RoomHeader';
import { useEffect, useMemo, useState } from 'react';
import { getRoomToken } from '@/src/utils/local-storage';
import { useRouter } from 'next/navigation';
import BaseSocket from '@/src/sockets/base-socket';
import { useErrorNotification } from '@/src/modules/notifications/NotifcationContext';
import { fetchAdminRoomInfo } from '@/src/api/requests/browser/room';
import { useRoomId } from '@/app/room/[roomId]/hooks';
import RoomBids from '@/app/room/[roomId]/RoomBids';
import RoomBidInfo from '@/app/room/[roomId]/RoomBidInfo';
import RoomLotInfo from '@/app/room/[roomId]/RoomLotInfo';

const roomSocket = new BaseSocket('http://localhost:3000/ws/room');

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
    setMembers((prevMembers) => [...prevMembers, member]);
    setInvites((prevInvites) => prevInvites.filter((invite) => invite.id !== member.id));
  };
  const onInvite = (invite: RoomMember) => setInvites((prevInvites) => [...prevInvites, invite]);
  const onBid = (bid: RoomBid) => setActiveLotBids((prevBids) => [...prevBids, bid]);
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
      .then((response) => {
        setRoomInfo(response);
        setActiveLotBids(response.activeLotBids);
        setMembers(response.members);
        setActiveLot(response.activeLot);
        setInvites(response.invites);

        connectRoomSocket({
          onMember,
          onInvite,
          onBid,
          onLot,
          onError,
          onFinish: () => router.push(`/crm/auctions/${response.room.auction.id}`),
        })(token);
      })
      .catch(onError);

    return () => {
      roomSocket.disconnect();
    };
  }, []);

  const lots = roomInfo?.lots || [];

  const activeLotCurrentBid = activeLotBids?.length
    ? activeLotBids[activeLotBids.length - 1]
    : activeLotBids[0];

  const isLastLot = useMemo(() => {
    if (!activeLot) return true;

    const lotIndex = lots.findIndex((lot) => lot.id === activeLot?.id);

    const lotNumber = lotIndex + 1;

    const totalLots = lots.length;

    return lotNumber === totalLots;
  }, [activeLot, lots]);

  const switchLot = () => {
    if (isLastLot) {
      roomSocket.emitEvent('finishAuction');
      return;
    }

    roomSocket.emitEvent('placeLot');
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

  if (!roomInfo) {
    return null;
  }

  const currency = activeLot!.currency;

  const roomBid = <RoomBidInfo bid={activeLotCurrentBid!} currency={currency} />;

  return (
    <div className="p-6 h-screen flex flex-col">
      <RoomHeader auction={roomInfo.room.auction} />

      <main className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
        <div className="flex flex-col gap-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Active lot</h2>

            <RoomLotInfo lot={activeLot!} bid={roomBid} />

            <div className="flex gap-3 mt-4">
              <button onClick={switchLot} className="btn btn-primary">
                {isLastLot ? 'Finish auction' : 'Next lot'}
              </button>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6 h-full">
          <RoomBids currency={currency} bids={activeLotBids} />
        </div>

        <div className="flex flex-col gap-6 h-full">
          <section className="flex-1 flex flex-col">
            <h2 className="text-2xl font-semibold mb-4">Participants</h2>
            <div className="card bg-base-100 shadow-md rounded-md flex-1 overflow-y-auto p-4 space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <span>{member.name}</span>
                  <span className="badge badge-success">joined</span>
                </div>
              ))}
              {invites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between">
                  <span>{invite.name}</span>
                  <span className="badge badge-neutral">invited</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default RoomAdminPage;
