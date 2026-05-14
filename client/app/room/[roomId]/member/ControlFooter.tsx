import { Button } from '@/ui-kit/ui/button';
import { useMemberRoom } from '@/src/modules/room-engine/member/hooks/useMemberRoom';
import { useErrorNotification } from '@/src/modules/notifications/NotifcationContext';

const ControlFooter = () => {
  const {
    bidIncrement,
    isSubmitBidDisabled,
    isWinning,
    leadingBid,
    leadingAmount,
    lotCurrency,
    engine,
  } = useMemberRoom();

  const showError = useErrorNotification();

  const value = leadingAmount + bidIncrement;

  const getHint = () => {
    if (!leadingBid) return `Your bid will be ${value.toLocaleString()} ${lotCurrency || ''}`;

    if (isWinning) {
      return `You're leading · ${leadingBid?.amount.toLocaleString()} ${lotCurrency}`;
    }

    return `Current leader: ${leadingBid.name} · Your bid will be ${value.toLocaleString()} ${lotCurrency}`;
  };

  const handleClick = () => {
    try {
      engine.placeBid();
    } catch (error) {
      showError(error);
    }
  };

  return (
    <footer className="bg-background border-t px-4 py-3 flex flex-col gap-1.5 flex-shrink-0">
      <div className="max-w-lg mx-auto w-full flex flex-col gap-1.5">
        <Button
          disabled={isSubmitBidDisabled}
          className="w-full h-12 text-sm rounded-xl"
          size="lg"
          onClick={handleClick}
        >
          Place bid · {value.toLocaleString()} {lotCurrency}
        </Button>
        <p className="text-xs text-muted-foreground text-center">{getHint()}</p>
      </div>
    </footer>
  );
};

export default ControlFooter;
