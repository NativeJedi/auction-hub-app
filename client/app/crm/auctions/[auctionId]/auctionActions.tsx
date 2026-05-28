import { Button } from '@/ui-kit/ui/button';
import { BarChart2Icon } from 'lucide-react';
import Link from 'next/link';
import { AuctionStatus } from '@/src/api/dto/auction.dto';
import { type Action } from '@/src/components/AuctionPageHeader';
import StartAuctionButton from './StartAuction.button';
import ResetAuctionButton from './ResetAuction.button';

type Auction = {
  id: string;
  status: AuctionStatus;
};

export function getAuctionActions(auction: Auction, hasLots: boolean): Action[] {
  return [
    {
      component: (
        <Button variant="outline" asChild>
          <Link href={`/results/${auction.id}?role=admin`}>
            <BarChart2Icon className="size-4" />
            Results
          </Link>
        </Button>
      ),
      isVisible: auction.status === AuctionStatus.FINISHED,
    },
    {
      component: <StartAuctionButton auctionId={auction.id} />,
      isVisible: auction.status === AuctionStatus.CREATED && hasLots,
    },
    {
      component: <ResetAuctionButton auctionId={auction.id} />,
      isVisible:
        auction.status === AuctionStatus.STARTED || auction.status === AuctionStatus.FINISHED,
    },
  ];
}
