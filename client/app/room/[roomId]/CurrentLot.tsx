import { LotImage } from '@/src/api/dto/lot.dto';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/ui-kit/ui/carousel';
import RoomCard from '@/app/room/[roomId]/RoomCard';

type Lot = {
  name: string;
  description?: string;
  startPrice: string;
  images: LotImage[];
};

type Props = {
  tool?: React.ReactNode;
  lot: Lot;
  className?: string;
};

const CurrentLot = ({ tool, lot, className }: Props) => (
  <RoomCard title="Current lot" tool={tool} className={className}>
    <div className="relative overflow-hidden rounded-md flex-shrink-0">
      <Carousel className="w-full">
        <CarouselContent className="-ml-0">
          {lot.images.map((img) => (
            <CarouselItem key={img.id} className="pl-0">
              <img
                src={img.url}
                alt={lot.name}
                className="w-full block object-cover"
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
  </RoomCard>
);

export default CurrentLot;
