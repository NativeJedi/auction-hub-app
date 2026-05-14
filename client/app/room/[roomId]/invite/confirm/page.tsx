'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useErrorNotification } from '@/src/modules/notifications/NotifcationContext';
import { useRoomId } from '@/app/room/[roomId]/hooks';
import { useQueryParam } from '@/src/utils/url';
import { useMemberEngine } from '@/src/modules/room-engine/member/hooks/useMemberEngine';

const ConfirmInvite = () => {
  const roomId = useRoomId();
  const inviteToken = useQueryParam('token');
  const router = useRouter();
  const handleError = useErrorNotification();

  const engine = useMemberEngine(roomId);

  useEffect(() => {
    if (!inviteToken) return;

    engine
      .confirmInvite(inviteToken)
      .then(() => {
        router.push(`/room/${roomId}/member`);
      })
      .catch((e: unknown) => {
        console.error(e);
        handleError(e);
      });
  }, []);

  return null;
};

export default ConfirmInvite;
