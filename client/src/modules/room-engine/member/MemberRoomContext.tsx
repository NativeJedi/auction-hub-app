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
import { MemberRoomState } from './types';
import { MemberRoomEngine } from './MemberRoomEngine';
import { useErrorNotification } from '@/src/modules/notifications/NotifcationContext';
import { useMemberEngine } from '@/src/modules/room-engine/member/hooks/useMemberEngine';

type MemberRoomContextValue = {
  state: MemberRoomState;
  engine: MemberRoomEngine;
};

const MemberRoomContext = createContext<MemberRoomContextValue | null>(null);

type MemberRoomProviderProps = {
  roomId: string;
  onError?: (error: Error) => void;
  children: ReactNode;
};

export function MemberRoomProvider({ roomId, children }: MemberRoomProviderProps) {
  const engine = useMemberEngine(roomId);

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

  const value = useMemo(
    () => ({
      engine,
      state,
    }),
    [engine, state]
  );

  return <MemberRoomContext.Provider value={value}>{children}</MemberRoomContext.Provider>;
}

export function useMemberRoomContext(): MemberRoomContextValue {
  const ctx = useContext(MemberRoomContext);

  if (!ctx) throw new Error('useMemberRoomContext must be used within MemberRoomProvider');

  return ctx;
}
