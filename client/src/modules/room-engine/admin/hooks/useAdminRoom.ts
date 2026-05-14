'use client';

import { useAdminRoomContext } from '@/src/modules/room-engine/admin/AdminRoomContext';

export function useAdminRoom() {
  const { engine, state } = useAdminRoomContext();

  if (state.error) throw new Error(state.error);

  return {
    engine,
    isLoading: state.isLoading,
    auction: state.auction,
    activeLot: state.activeLot,
    lots: state.lots,
    bids: state.bids,
    members: state.members,
    invites: state.invites,
    isLastLot: engine.isLastLot,
  };
}
