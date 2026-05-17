'use client';

import { confirmModal } from '@/src/modules/modals/ConfirmModal';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui-kit/ui/button';
import { Play } from 'lucide-react';
import { AdminRoomEngine } from '@/src/modules/room-engine/admin/AdminRoomEngine';
import { useErrorNotification } from '@/src/modules/notifications/NotifcationContext';

const StartAuctionButton = ({ auctionId }: { auctionId: string }) => {
  const router = useRouter();

  const onError = useErrorNotification();

  const handleStartAuction = async () => {
    const { result } = await confirmModal.show({
      title: 'Start Auction?',
      description: "If auction starts, you won't be able to edit it anymore.",
    });

    if (result === 'closed') return;

    try {
      const room = await AdminRoomEngine.startAuction(auctionId);

      router.push(`/room/${room.auctionId}/admin`);
    } catch (error) {
      onError(error);
    }
  };

  return (
    <Button variant="success" onClick={handleStartAuction}>
      <Play />
      Start
    </Button>
  );
};

export default StartAuctionButton;
