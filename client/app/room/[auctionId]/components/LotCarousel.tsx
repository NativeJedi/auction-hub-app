'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/ui-kit/ui/carousel';
import { RoomLot } from '@/src/api/dto/room.dto';

type Props = {
  images: RoomLot['images'];
  name: string;
};

const LotCarousel = ({ images, name }: Props) => (
  <div className="relative overflow-hidden rounded-md flex-shrink-0 aspect-video md:aspect-auto md:flex-1 md:min-h-0">
    <Carousel className="w-full h-full [&>div]:h-full">
      <CarouselContent className="-ml-0 h-full">
        {images.map((img) => (
          <CarouselItem key={img.id} className="pl-0 h-full">
            <img src={img.url} alt={name} className="w-full h-full block object-contain" />
          </CarouselItem>
        ))}
      </CarouselContent>
      {images.length > 1 && (
        <>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </>
      )}
    </Carousel>
  </div>
);

export default LotCarousel;
