import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/ui-kit/ui/carousel';
import { Skeleton } from '@/ui-kit/ui/skeleton';
import { RoomLot } from '@/src/api/dto/room.dto';
import { ImageOff } from 'lucide-react';
import RoomCard from '@/app/room/[roomId]/components/RoomCard';

type Props = {
  tool?: React.ReactNode;
  lot?: RoomLot | null;
  className?: string;
  isLoading?: boolean;
};

const CurrentLotSkeleton = () => (
  <>
    <Skeleton className="w-full aspect-video md:aspect-auto md:flex-1 md:min-h-0 rounded-md flex-shrink-0" />
    <Skeleton className="h-4 w-2/3 flex-shrink-0" />
    <Skeleton className="h-3 w-full flex-shrink-0" />
    <Skeleton className="h-3 w-4/5 flex-shrink-0" />
    <Skeleton className="h-10 w-full rounded-md flex-shrink-0" />
  </>
);

const NoLotPlaceholder = () => (
  <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground flex-shrink-0">
    <ImageOff className="size-8 opacity-40" />
    <p className="text-sm">No active lot</p>
  </div>
);

const ImagePlaceholder = () => (
  <div className="w-full aspect-video md:aspect-auto md:flex-1 md:min-h-0 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
    <ImageOff className="size-8 text-muted-foreground opacity-40" />
  </div>
);

const LotContent = ({ isLoading, lot }: Pick<Props, 'lot' | 'isLoading'>) => {
  if (isLoading) {
    return <CurrentLotSkeleton />;
  }

  if (!lot) {
    return <NoLotPlaceholder />;
  }

  return (
    <>
      {lot!.images.length === 0 ? (
        <ImagePlaceholder />
      ) : (
        <div className="relative overflow-hidden rounded-md flex-shrink-0 aspect-video md:aspect-auto md:flex-1 md:min-h-0">
          <Carousel className="w-full h-full [&>div]:h-full">
            <CarouselContent className="-ml-0 h-full">
              {lot.images.map((img) => (
                <CarouselItem key={img.id} className="pl-0 h-full">
                  <img
                    src={img.url}
                    alt={lot.name}
                    className="w-full h-full block object-contain"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            {lot.images.length > 1 && (
              <>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </>
            )}
          </Carousel>
        </div>
      )}

      <p className="text-sm font-medium flex-shrink-0">{lot.name}</p>

      {lot.description && (
        <p className="text-xs text-muted-foreground leading-relaxed flex-shrink-0">
          {lot.description}
        </p>
      )}

      <div className="bg-muted rounded-md px-3 py-2 flex-shrink-0">
        <p className="text-[10px] text-muted-foreground">Start price</p>
        <p className="text-sm font-medium">{lot.startPrice}</p>
      </div>
    </>
  );
};

const CurrentLot = ({ tool, lot, className, isLoading }: Props) => {
  return (
    <RoomCard title="Current lot" tool={tool} className={className}>
      <LotContent lot={lot} isLoading={isLoading} />
    </RoomCard>
  );
};

export default CurrentLot;
