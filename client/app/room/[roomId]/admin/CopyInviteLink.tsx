import { Room } from '@/src/api/dto/room.dto';
import { useNotification } from '@/src/modules/notifications/NotifcationContext';
import { Button } from '@/ui-kit/ui/button';
import { CopyIcon } from 'lucide-react';

const CopyInviteLink = ({ roomId }: { roomId: Room['id'] }) => {
  const INVITE_LINK = `${window.location.origin}/room/${roomId}/invite`;

  const { showToast } = useNotification();

  const handleCopy = () => {
    navigator.clipboard.writeText(INVITE_LINK).then(() => {
      showToast({
        type: 'success',
        title: 'Copied to clipboard',
        message: 'Invite link has been copied to your clipboard.',
      });
    });
  };

  return (
    <Button onClick={handleCopy}>
      <CopyIcon /> Invite link
    </Button>
  );
};

export default CopyInviteLink;
