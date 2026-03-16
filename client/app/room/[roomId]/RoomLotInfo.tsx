import { RoomLot } from '@/src/api/dto/room.dto';
import RoomCard from '@/app/room/[roomId]/RoomCard';
import { PropsWithChildren } from 'react';

type Props = PropsWithChildren<{
  lot: RoomLot;
}>;

const RoomLotInfo = ({ lot, children }: Props) => {
  return (
    <RoomCard title={lot.name} description={lot.description}>
      <p className="font-medium">
        Start price: {lot.startPrice} {lot.currency}
      </p>

      {children}
    </RoomCard>
  );
};

export default RoomLotInfo;
