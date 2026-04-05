import { LotImage } from '@/src/api/dto/lot.dto';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/src/ui-kit/ui/carousel';

type Props = {
  images: LotImage[];
};

const LotImagesCarousel = ({ images }: Props) => {
  if (!images.length) {
    return null;
  }

  return (
    <Carousel className="w-full">
      <CarouselContent className="-ml-0">
        {images.map((image) => (
          <CarouselItem key={image.id} className="pl-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt="Lot image" className="w-full h-64 object-contain bg-muted" />
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
  );
};

export default LotImagesCarousel;
