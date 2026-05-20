'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui-kit/ui/button';
import { useNotification } from '@/src/modules/notifications/NotifcationContext';
import { logout } from '@/src/api/auctions-api-client/requests/auth';
import { RoomEngine } from '@/src/modules/room-engine/core/RoomEngine';

export default function LogoutButton() {
  const router = useRouter();
  const { showToast } = useNotification();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleConfirm = async () => {
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

  if (isConfirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Log out?</span>
        <Button variant="destructive" onClick={handleConfirm} loading={isPending}>
          Confirm
        </Button>
        <Button variant="ghost" onClick={() => setIsConfirming(false)} disabled={isPending}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={() => setIsConfirming(true)}
    >
      Log out
    </Button>
  );
}
