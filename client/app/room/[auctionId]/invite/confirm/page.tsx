'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useErrorNotification } from '@/src/modules/notifications/NotifcationContext';
import { useAuctionId } from '@/app/room/[auctionId]/hooks';
import { useQueryParam } from '@/src/utils/url';
import { useMemberEngine } from '@/src/modules/room-engine/member/hooks/useMemberEngine';

const ConfirmInvite = () => {
  const auctionId = useAuctionId();
  const inviteToken = useQueryParam('token');
  const router = useRouter();
  const handleError = useErrorNotification();

  const engine = useMemberEngine(auctionId);

  useEffect(() => {
    if (!inviteToken) return;

    engine
      .confirmInvite(inviteToken)
      .then(() => {
        router.push(`/room/${auctionId}/member`);
      })
      .catch((e: unknown) => {
        console.error(e);
        handleError(e);
      });
  }, []);

  return null;
};

export default ConfirmInvite;
