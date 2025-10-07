import { Currency } from '@/src/api/dto/lot.dto';

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
    <section className="flex-1 flex flex-col">
      <h2 className="text-2xl font-semibold mb-4">Bids</h2>
      <div className="card bg-base-100 shadow-md rounded-md flex-1 overflow-y-auto p-4 space-y-4">
        {sortedBids.map((bid, index) => (
          <div key={index} className="border-b pb-2">
            <h3 className="font-bold">
              {bid.amount} {currency}
            </h3>
            <p className="text-sm opacity-80">by {bid.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RoomBids;
