import { Separator } from '@/ui-kit/ui/separator';
import RoomCard from '@/app/room/[roomId]/RoomCard';

type Bid = { id: string; name: string; amount: string };

type Props = {
  bids: Bid[];
  className?: string;
};

const BidsCount = ({ bids }: { bids: Bid[] }) => (
  <span className="text-xs font-medium bg-muted border rounded-full px-2 py-0.5 text-muted-foreground">
    {bids.length + 1}
  </span>
);

const Bids = ({ bids, className }: React.PropsWithChildren<Props>) => {
  const [leadingBid, ...restBids] = bids;

  return (
    <RoomCard title="Bids" tool={<BidsCount bids={bids} />} className={className}>
      <div className="rounded-md px-4 py-3 bg-secondary/10 border border-secondary/20 flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-[10px] font-medium text-secondary/70 uppercase tracking-wide">
            Leading bid
          </p>
          <p className="text-base font-medium text-secondary">{leadingBid.name}</p>
        </div>
        <span className="text-4xl font-semibold text-secondary">{leadingBid.amount}</span>
      </div>

      <Separator />

      <div className="flex flex-col">
        {restBids.map((bid) => (
          <div
            key={bid.id}
            className="flex items-center justify-between py-2 border-b last:border-b-0"
          >
            <span className="text-xs font-medium">{bid.name}</span>
            <span className="text-xs font-medium text-muted-foreground">{bid.amount}</span>
          </div>
        ))}
      </div>
    </RoomCard>
  );
};

export default Bids;
