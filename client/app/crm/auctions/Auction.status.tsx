import { AuctionStatus } from '@/src/api/dto/auction.dto';
import { StatusBadge, StatusMap } from '@/src/components/StatusBadge';

export default function AuctionStatusBadge({ status }: { status: AuctionStatus }) {
  const statusMap: StatusMap<AuctionStatus> = {
    [AuctionStatus.CREATED]: 'default',
    [AuctionStatus.STARTED]: 'info',
    [AuctionStatus.FINISHED]: 'success',
  };

  return <StatusBadge status={status} map={statusMap} />;
}
