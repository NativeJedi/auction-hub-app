'use client';

import { confirmModal } from '@/src/modules/modals/ConfirmModal';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui-kit/ui/button';
import { Play } from 'lucide-react';
import { AdminRoomEngine } from '@/src/modules/room-engine/admin/AdminRoomEngine';
import { useErrorNotification } from '@/src/modules/notifications/NotifcationContext';
import { useState } from 'react';

const StartAuctionButton = ({ auctionId }: { auctionId: string }) => {
  const router = useRouter();

  const onError = useErrorNotification();

  const [loading, setLoading] = useState(false);

  const handleStartAuction = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button loading={loading} variant="success" onClick={handleStartAuction}>
      <Play />
      Start
    </Button>
  );
};

export default StartAuctionButton;
