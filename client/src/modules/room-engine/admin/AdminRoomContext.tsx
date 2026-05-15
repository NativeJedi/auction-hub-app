'use client';

import {
  createContext,
  useContext,
  type ReactNode,
  useMemo,
  useEffect,
  useCallback,
  useSyncExternalStore,
} from 'react';
import { AdminRoomState } from './types';
import { AdminRoomEngine } from './AdminRoomEngine';
import { useErrorNotification } from '@/src/modules/notifications/NotifcationContext';
import { useAdminEngine } from '@/src/modules/room-engine/admin/hooks/useAdminEngine';
import { useRouter } from 'next/navigation';

type AdminRoomContextValue = {
  state: AdminRoomState;
  engine: AdminRoomEngine;
};

const AdminRoomContext = createContext<AdminRoomContextValue | null>(null);

type AdminRoomProviderProps = {
  roomId: string;
  children: ReactNode;
};

export function AdminRoomProvider({ roomId, children }: AdminRoomProviderProps) {
  const engine = useAdminEngine(roomId);
  const onError = useErrorNotification();
  const router = useRouter();

  useEffect(() => {
    engine.onAuctionFinished(() => {
      const auctionId = engine.getState().auction?.id;
      if (auctionId) router.push(`/results/${auctionId}?role=admin`);
    });
    engine.setOnError(onError);
  }, [engine, router, onError]);

  useEffect(() => {
    engine.connect();
    return () => engine.destroy();
  }, [engine]);

  const subscribe = useCallback(
    (notify: () => void) => engine.subscribe(notify),
    [engine]
  );

  const getSnapshot = useCallback(() => engine.getState(), [engine]);

  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const value = useMemo(() => ({ engine, state }), [engine, state]);

  return <AdminRoomContext.Provider value={value}>{children}</AdminRoomContext.Provider>;
}

export function useAdminRoomContext(): AdminRoomContextValue {
  const ctx = useContext(AdminRoomContext);
  if (!ctx) throw new Error('useAdminRoomContext must be used within AdminRoomProvider');
  return ctx;
}
