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
import { PublicRoomState } from './types';
import { PublicRoomEngine } from './PublicRoomEngine';
import { useErrorNotification } from '@/src/modules/notifications/NotifcationContext';
import { usePublicEngine } from '@/src/modules/room-engine/public/hooks/usePublicEngine';

type PublicRoomContextValue = {
  state: PublicRoomState;
  engine: PublicRoomEngine;
};

const PublicRoomContext = createContext<PublicRoomContextValue | null>(null);

type PublicRoomProviderProps = {
  roomId: string;
  children: ReactNode;
};

export function PublicRoomProvider({ roomId, children }: PublicRoomProviderProps) {
  const engine = usePublicEngine(roomId);
  const onError = useErrorNotification();

  useEffect(() => {
    engine.setOnError(onError);
  }, [engine, onError]);

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

  return <PublicRoomContext.Provider value={value}>{children}</PublicRoomContext.Provider>;
}

export function usePublicRoomContext(): PublicRoomContextValue {
  const ctx = useContext(PublicRoomContext);
  if (!ctx) throw new Error('usePublicRoomContext must be used within PublicRoomProvider');
  return ctx;
}
