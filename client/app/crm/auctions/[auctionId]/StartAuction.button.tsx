'use client';

import { confirmModal } from '@/src/modules/modals/ConfirmModal';
import { useRouter } from 'next/navigation';
import { setRoomToken } from '@/src/utils/local-storage';
import { createRoom } from '@/src/api/auctions-api-client/requests/room';
import { Button } from '@/ui-kit/ui/button';
import { Play } from 'lucide-react';

const StartAuctionButton = ({ auctionId }: { auctionId: string }) => {
  const router = useRouter();

  const handleStartAuction = async () => {
    const { result } = await confirmModal.show({
      title: 'Start Auction?',
      description: "If auction starts, you won't be able to edit it anymore.",
    });

    if (result === 'closed') return;

    const { room, token } = await createRoom({ auctionId });

    setRoomToken(room.id, token);

    router.push(`/room/${room.id}/admin`);
  };

  return (
    <Button variant="success" onClick={handleStartAuction}>
      <Play />
      Start
    </Button>
  );
};

export default StartAuctionButton;
