import { useNumberInput } from '@/src/modules/forms/fields/Number/useNumberInput';
import RoomCard from '@/app/room/[auctionId]/components/RoomCard';
import { useMemberRoom } from '@/src/modules/room-engine/member/hooks/useMemberRoom';

const MAX_BID_AMOUNT = 9_999_999;

type BidAmountInputProps = {
  value: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
};

const BidAmountInput = ({
  value,
  min,
  max = MAX_BID_AMOUNT,
  disabled,
  onChange,
}: BidAmountInputProps) => {
  const { inputValue, handleChange, handleBlur } = useNumberInput({ value, min, max, onChange });

  const maxDigits = String(max).length;

  return (
    <input
      type="number"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={disabled}
      min={min}
      max={max}
      style={{
        width: `${Math.min(Math.max(inputValue.length, 3), maxDigits)}ch`,
      }}
      className="bg-transparent text-3xl font-bold focus:outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
  );
};

const BidController = () => {
  const { leadingBid, isWinning, lotCurrency, leadingAmount, engine, bidIncrement, isLoading } =
    useMemberRoom();

  const value = leadingAmount + bidIncrement;

  const handleChange = (amount: number) => {
    engine.changeBidAmount(amount);
  };

  return (
    <RoomCard title="Your bid">
      {isWinning && (
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-success flex-shrink-0" />
          <span className="text-xs font-medium text-success">You&apos;re winning</span>
          <span className="ml-auto text-xs font-medium text-success">
            {leadingAmount.toLocaleString()} {lotCurrency}
          </span>
        </div>
      )}

      <div className="bg-muted rounded-xl overflow-hidden">
        <div className="px-4 py-3.5 flex items-center gap-3">
          <div className="flex items-baseline gap-2">
            <BidAmountInput
              disabled={isLoading}
              value={value}
              min={leadingAmount}
              onChange={handleChange}
            />
            <span className="text-2xl font-semibold text-muted-foreground">{lotCurrency}</span>
          </div>
          {Boolean(bidIncrement) && (
            <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
              +
              <span className="text-primary font-semibold">
                {bidIncrement.toLocaleString()} {lotCurrency}
              </span>{' '}
              to current
            </span>
          )}
        </div>

        {leadingBid && !isWinning && (
          <div className="px-4 py-2 border-t border-muted-foreground/10 flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Current bid</span>
            <span className="text-xs font-semibold tabular-nums">
              {leadingBid.amount.toLocaleString()} {lotCurrency}
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground truncate">{leadingBid.name}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 max-w-xs">
        {[100, 500, 1000].map((step) => (
          <button
            key={step}
            onClick={() => engine.increaseBidAmount(step)}
            className="h-10 rounded-xl border border-primary/20 bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            disabled={isLoading}
          >
            +{step.toLocaleString()}
          </button>
        ))}
      </div>
    </RoomCard>
  );
};

export default BidController;
