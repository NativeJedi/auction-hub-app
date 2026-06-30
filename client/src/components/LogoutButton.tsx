'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui-kit/ui/button';
import { useNotification } from '@/src/modules/notifications/NotifcationContext';
import { makeSARequest } from '@/src/api/makeSARequest';
import { logoutAction } from '@/src/api/actions/auth.actions';
import { RoomEngine } from '@/src/modules/room-engine/core/RoomEngine';
import { confirmModal } from '@/src/modules/modals/ConfirmModal';

const logout = makeSARequest(logoutAction);

export default function LogoutButton() {
  const router = useRouter();
  const { showToast } = useNotification();
  const [isPending, setIsPending] = useState(false);

  const handleClick = async () => {
    const { result } = await confirmModal.show({
      title: 'Log out',
      description: 'Are you sure you want to log out?',
    });

    if (result === 'closed') return;

    setIsPending(true);
    try {
      await logout();
      RoomEngine.clearAllRoomTokens();
      router.push('/crm/auth');
    } catch (error) {
      setIsPending(false);
      showToast({
        title: 'Logout failed',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.',
        type: 'error',
      });
    }
  };

  return (
    <Button
      variant="outline"
      className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
      loading={isPending}
      onClick={handleClick}
    >
      Log out
    </Button>
  );
}
