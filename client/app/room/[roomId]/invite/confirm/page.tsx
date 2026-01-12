'use client';

import { useEffect } from 'react';
import { setRoomToken } from '@/src/utils/local-storage';
import { useQueryParam, useRoomId } from '@/app/room/[roomId]/hooks';
import { useRouter } from 'next/navigation';
import { useErrorNotification } from '@/src/modules/notifications/NotifcationContext';
import { confirmRoomInvite } from '@/src/api/auctions-api-client/requests/room';

const ConfirmInvite = () => {
  const roomId = useRoomId();
  const inviteToken = useQueryParam('token');
  const router = useRouter();
  const handleError = useErrorNotification();

  useEffect(() => {
    if (!inviteToken) return;

    confirmRoomInvite(roomId, { token: inviteToken })
      .then(({ token }) => {
        setRoomToken(roomId, token);

        return router.push(`/room/${roomId}/member`);
      })
      .catch((e) => {
        console.error(e);
        handleError(e);
      });
  }, []);

  return null;
};

export default ConfirmInvite;
