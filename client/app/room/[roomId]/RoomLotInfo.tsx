import { RoomLot } from '@/src/api/dto/room.dto';

type Props = {
  lot: RoomLot;
  bid?: React.ReactNode;
};

const ActiveLot = ({ lot, bid }: Props) => {
  return (
    <div className="card bg-base-100 shadow-md p-6 rounded-md">
      <h3 className="text-xl font-bold">{lot.name}</h3>
      <p className="text-sm opacity-80 mb-2">{lot.description}</p>
      <p className="font-medium">
        Start price: {lot.startPrice} {lot.currency}
      </p>
      {bid}
    </div>
  );
};
export default ActiveLot;
