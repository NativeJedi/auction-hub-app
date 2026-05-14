'use client';

import { useMemberRoomContext } from '@/src/modules/room-engine/member/MemberRoomContext';

export function useMemberRoom() {
  const { engine, state } = useMemberRoomContext();

  return {
    engine,
    isLoading: state.isLoading,
    bidIncrement: state.bidIncrement,
    lotCurrency: engine.lotCurrency,
    isWinning: engine.isWinning,
    leadingBid: engine.leadingBid,
    leadingAmount: engine.leadingAmount,
    isSubmitBidDisabled: engine.isSubmitBidDisabled,
  };
}
