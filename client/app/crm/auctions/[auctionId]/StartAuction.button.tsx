'use client';

import { confirmModal } from '@/src/modules/modals/ConfirmModal';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui-kit/ui/button';
import { Play } from 'lucide-react';
import { AdminRoomEngine } from '@/src/modules/room-engine/admin/AdminRoomEngine';

const StartAuctionButton = ({ auctionId }: { auctionId: string }) => {
  const router = useRouter();

  const handleStartAuction = async () => {
    const { result } = await confirmModal.show({
      title: 'Start Auction?',
      description: "If auction starts, you won't be able to edit it anymore.",
    });

    if (result === 'closed') return;

    const room = await AdminRoomEngine.startAuction(auctionId);

    router.push(`/room/${room.auctionId}/admin`);
  };

  return (
    <Button variant="success" onClick={handleStartAuction}>
      <Play />
      Start
    </Button>
  );
};

export default StartAuctionButton;
