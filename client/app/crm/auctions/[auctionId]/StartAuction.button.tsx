'use client';

import { confirmModal } from '@/src/modules/modals/ConfirmModal';
import { useRouter } from 'next/navigation';
import { setRoomToken } from '@/src/utils/local-storage';
import { createRoom } from '@/src/api/auctions-api-client/requests/room';

const StartAuctionButton = ({ auctionId }: { auctionId: string }) => {
  const router = useRouter();

  const handleStartAuction = async () => {
    const { result } = await confirmModal.show({
      title: 'Start Auction?',
      description: 'If auction is started, you will not be able to edit it anymore.',
    });

    if (result === 'closed') return;

    const { room, token } = await createRoom({ auctionId });

    setRoomToken(room.id, token);

    router.push(`/room/${room.id}/admin`);
  };

  return (
    <button
      className="btn btn-success flex items-center gap-2 min-w-35"
      onClick={handleStartAuction}
    >
      Start auction
    </button>
  );
};

export default StartAuctionButton;
