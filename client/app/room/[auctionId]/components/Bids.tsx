import { Separator } from '@/ui-kit/ui/separator';
import { Skeleton } from '@/ui-kit/ui/skeleton';
import { Gavel } from 'lucide-react';
import { PropsWithChildren } from 'react';
import { PublicBidInfo } from '@/src/api/dto/room.dto';
import RoomCard from '@/app/room/[auctionId]/components/RoomCard';

type Props = {
  bids: PublicBidInfo[];
  className?: string;
  isLoading?: boolean;
};

const BidsCount = ({ bids }: Pick<Props, 'bids'>) => (
  <span className="text-xs font-medium bg-muted border rounded-full px-2 py-0.5 text-muted-foreground">
    {bids.length}
  </span>
);

const NoBidsPlaceholder = () => (
  <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground flex-shrink-0">
    <Gavel className="size-8 opacity-40" />
    <p className="text-sm">No bids yet</p>
  </div>
);

const BidsSkeleton = () => (
  <>
    <Skeleton className="h-16 w-full rounded-md flex-shrink-0" />
    <Separator />
    <div className="flex flex-col gap-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b last:border-b-0">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  </>
);

const ContentGuard = ({
  isLoading,
  noContent,
  children,
}: PropsWithChildren<{ isLoading?: boolean; noContent: boolean }>) => {
  if (isLoading) {
    return <BidsSkeleton />;
  }
  if (noContent) {
    return <NoBidsPlaceholder />;
  }
  return children;
};

const Bids = ({ bids, className, isLoading }: React.PropsWithChildren<Props>) => {
  const [leadingBid, ...restBids] = bids;

  return (
    <RoomCard title="Bids" tool={<BidsCount bids={bids} />} className={className}>
      <ContentGuard isLoading={isLoading} noContent={!bids.length}>
        {leadingBid && (
          <div className="rounded-md px-4 py-3 bg-secondary/10 border border-secondary/20 flex items-center justify-between flex-shrink-0">
            <div>
              <p className="text-[10px] font-medium text-secondary/70 uppercase tracking-wide">
                Leading bid
              </p>
              <p className="text-base font-medium text-secondary">{leadingBid.name}</p>
            </div>
            <span className="text-4xl font-semibold text-secondary">{leadingBid.amount}</span>
          </div>
        )}

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
      </ContentGuard>
    </RoomCard>
  );
};

export default Bids;
