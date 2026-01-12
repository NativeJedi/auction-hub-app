'use client';

import RoomHeader from '@/app/room/[roomId]/RoomHeader';
import { MemberBidInfo, RoomLot, RoomMemberInfoResponseDto } from '@/src/api/dto/room.dto';
import BaseSocket from '@/src/sockets/base-socket';
import { useEffect, useState } from 'react';
import { getRoomToken } from '@/src/utils/local-storage';
import { useErrorNotification } from '@/src/modules/notifications/NotifcationContext';
import RoomLotInfo from '@/app/room/[roomId]/RoomLotInfo';
import RoomBids from '@/app/room/[roomId]/RoomBids';
import { useRoomId } from '@/app/room/[roomId]/hooks';
import { Currency } from '@/src/api/dto/lot.dto';
import { AppClientConfig } from '@/config/client';
import { fetchMemberRoomInfo } from '@/src/api/auctions-api-client/requests/room';

class RoomMemberSocket extends BaseSocket {
  onNewLot(callback: (lot: RoomLot) => void) {
    this.onEvent<RoomLot>('newLot', callback);
  }

  onNewBid(callback: (bid: MemberBidInfo) => void) {
    this.onEvent<MemberBidInfo>('newBid', callback);
  }
}

const memberSocket = new RoomMemberSocket(AppClientConfig.NEXT_PUBLIC_API_WEBSOCKET_URL);

const useMemberRoom = () => {
  const roomId = useRoomId();
  const [roomInfo, setRoomInfo] = useState<RoomMemberInfoResponseDto>();
  const [activeLot, setActiveLot] = useState<RoomLot>();
  const [activeLotBidAmount, setActiveLotBidAmount] = useState(0);
  const [activeLotBids, setActiveLotBids] = useState<MemberBidInfo[]>([]);

  const handleError = useErrorNotification();

  useEffect(() => {
    const token = getRoomToken(roomId);

    if (!token) {
      handleError({ message: 'Token not found' });
      return;
    }

    fetchMemberRoomInfo({ roomId })
      .then((response) => {
        setRoomInfo(response);
        setActiveLot(response.activeLot);

        const { activeLotBids } = response;
        setActiveLotBids(activeLotBids);

        const lastBid = activeLotBids[activeLotBids.length - 1];
        setActiveLotBidAmount(lastBid?.amount || response.activeLot?.startPrice || 0);

        memberSocket.connect(token);

        memberSocket.onNewBid((bid) => {
          setActiveLotBids((prevBids) => [...prevBids, bid]);
          setActiveLotBidAmount(bid.amount);
        });

        memberSocket.onNewLot((lot) => {
          setActiveLot(lot);
          setActiveLotBids([]);
          setActiveLotBidAmount(lot.startPrice);
        });
      })
      .catch(handleError);

    return () => {
      memberSocket.disconnect();
    };
  }, []);

  const activeBid = activeLotBids[activeLotBids.length - 1];

  const increaseBid = (amount: number) => {
    const newBid = activeLotBidAmount + amount;

    setActiveLotBidAmount((prevBid) => {
      if (prevBid >= newBid) {
        return prevBid;
      }

      return newBid;
    });
  };

  const isSendBidDisabled = activeBid && activeLotBidAmount === activeBid.amount;

  const sendBid = () => {
    if (!activeLot || isSendBidDisabled) return;

    const amount = activeBid ? activeLotBidAmount - activeBid.amount : activeLotBidAmount;

    memberSocket.emitEvent('placeBid', { amount, lotId: activeLot.id });
  };

  const activeLotCurrency = activeLot?.currency || Currency.UAH;

  return {
    roomInfo,
    sendBid,
    increaseBid,
    activeLot,
    activeLotBidAmount,
    isSendBidDisabled,
    activeLotCurrency,
    activeLotBids,
  };
};

const RoomMemberPage = () => {
  const {
    roomInfo,
    activeLot,
    activeLotBidAmount,
    increaseBid,
    isSendBidDisabled,
    sendBid,
    activeLotCurrency,
    activeLotBids,
  } = useMemberRoom();

  if (!roomInfo) {
    return null;
  }

  const handleIncreaseBid = (amount: number) => () => increaseBid(amount);

  return (
    <div className="p-6 h-screen flex flex-col">
      <RoomHeader auction={roomInfo.room.auction} />

      <main className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
        <div className="flex flex-col gap-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Active lot</h2>

            <RoomLotInfo lot={activeLot!} />
          </section>
        </div>

        <div className="flex flex-col gap-6 h-full">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Place your bid</h2>
            <div className="card bg-base-100 shadow-md p-6 rounded-md flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={activeLotBidAmount}
                  type="number"
                  placeholder="Enter your bid"
                  className="input input-bordered w-full"
                />
                <button
                  className="btn btn-outline"
                  disabled={!activeLot}
                  onClick={handleIncreaseBid(500)}
                >
                  +500
                </button>
                <button
                  className="btn btn-outline"
                  disabled={!activeLot}
                  onClick={handleIncreaseBid(1000)}
                >
                  +1000
                </button>
              </div>
              <button
                disabled={isSendBidDisabled}
                onClick={sendBid}
                className="btn btn-primary w-full"
              >
                Place bid
              </button>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6 h-full">
          <RoomBids currency={activeLotCurrency} bids={activeLotBids} />
        </div>
      </main>
    </div>
  );
};

export default RoomMemberPage;
