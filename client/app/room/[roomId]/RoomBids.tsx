import { Currency } from '@/src/api/dto/lot.dto';
import RoomCard from '@/app/room/[roomId]/RoomCard';

type Bid = {
  amount: number;
  name: string;
};

type Props = {
  currency: Currency;
  bids: Bid[];
};

const RoomBids = ({ currency, bids }: Props) => {
  const sortedBids = [...bids].reverse();

  return (
    <RoomCard>
      {sortedBids.map((bid, index) => (
        <div key={index} className="border-b pb-2">
          <h3 className="font-bold">
            {bid.amount} {currency}
          </h3>
          <p className="text-sm opacity-80">by {bid.name}</p>
        </div>
      ))}
    </RoomCard>
  );
};

export default RoomBids;
