'use client';

import { usePublicRoomContext } from '@/src/modules/room-engine/public/PublicRoomContext';

export function usePublicRoom() {
  const { engine, state } = usePublicRoomContext();

  if (state.error) throw new Error(state.error);

  return {
    engine,
    isLoading: state.isLoading,
    auction: state.auction,
    activeLot: state.activeLot,
    bids: state.bids,
  };
}
