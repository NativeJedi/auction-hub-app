import { Skeleton } from '@/ui-kit/ui/skeleton';
import { cn } from '@/ui-kit/utils';
import { RoomLot } from '@/src/api/dto/room.dto';
import { LotStatus } from '@/src/api/dto/lot.dto';

type Props = {
  lots: RoomLot[];
  activeLotId?: string;
  isLoading?: boolean;
};

const LotStripSkeleton = () => (
  <>
    {Array.from({ length: 6 }).map((_, i) => (
      <Skeleton key={i} className="h-16 w-[110px] flex-shrink-0 rounded-md" />
    ))}
  </>
);

const LotStrip = ({ lots, activeLotId, isLoading }: Props) => {
  const isActive = (lot: RoomLot) => activeLotId && lot.id === activeLotId;
  const isSold = (lot: RoomLot) => lot.status === LotStatus.SOLD;

  return (
    <div className="flex gap-1.5 overflow-x-auto px-3 py-2.5 border-b [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-shrink-0">
      {isLoading ? (
        <LotStripSkeleton />
      ) : (
        lots.map((lot, index) => (
          <div
            key={lot.id}
            className={cn(
              'flex flex-col gap-0.5 px-2.5 py-1.5 rounded-md border min-w-[110px] max-w-[110px] flex-shrink-0',
              isActive(lot) && 'border-primary bg-primary/5',
              isSold(lot) && 'opacity-50'
            )}
          >
            <span
              className={cn('text-[10px] text-muted-foreground', isActive(lot) && 'text-primary')}
            >
              Lot {index + 1}
              {lot.status === LotStatus.CREATED ? ' · active' : ''}
            </span>
            <span
              className={cn(
                'text-xs font-medium truncate text-muted-foreground',
                isActive(lot) && 'text-primary',
                isSold(lot) && 'line-through'
              )}
            >
              {lot.name}
            </span>
            {lot.soldPrice && (
              <span className="text-[10px] font-medium text-success">{lot.soldPrice}</span>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default LotStrip;
