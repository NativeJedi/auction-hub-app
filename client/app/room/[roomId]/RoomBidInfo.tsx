import { RoomBid } from '@/src/api/dto/room.dto';
import { Currency } from '@/src/api/dto/lot.dto';

const RoomBidInfo = ({ currency, bid }: { bid: RoomBid; currency: Currency }) => {
  return (
    <div>
      <p className="font-medium">Current bid: {bid ? `${bid.amount} ${currency}` : '-'}</p>
      <p>By: {bid ? bid.name : '-'}</p>
    </div>
  );
};

export default RoomBidInfo;
