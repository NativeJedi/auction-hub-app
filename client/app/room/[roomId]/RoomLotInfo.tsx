import { RoomLot } from '@/src/api/dto/room.dto';
import { PropsWithChildren } from 'react';
import LotImagesCarousel from '@/app/room/[roomId]/LotImagesCarousel';
import { Card } from '@/src/ui-kit/ui/card';

type Props = PropsWithChildren<{
  lot: RoomLot;
}>;

const RoomLotInfo = ({ lot, children }: Props) => {
  return (
    <Card className="overflow-hidden h-full">
      <LotImagesCarousel images={lot.images} />
      <div className="p-4 space-y-2">
        <div>
          <h3 className="font-bold text-lg leading-tight">{lot.name}</h3>
          {lot.description && (
            <p className="text-sm text-muted-foreground">{lot.description}</p>
          )}
        </div>
        <p className="font-medium text-sm">
          Start price: {lot.startPrice} {lot.currency}
        </p>
        {children}
      </div>
    </Card>
  );
};

export default RoomLotInfo;
