import { formatISODate } from '@/src/utils/date';
import CreateLotButton from '@/app/crm/auctions/[auctionId]/CreateLot.button';
import LotsList from '@/app/crm/auctions/[auctionId]/LotsList.table';
import AuctionStatusBadge from '@/app/crm/auctions/Auction.status';
import { fetchAuctionByIdServer } from '@/src/api/auctions-api/requests/auctions';
import { fetchLotsServer } from '@/src/api/auctions-api/requests/lots';
import { AuctionStatus } from '@/src/api/dto/auction.dto';
import AuctionPageHeader from '@/src/components/AuctionPageHeader';
import { getAuctionActions } from './auctionActions';

type LotsPageProps = {
  params: Promise<{
    auctionId: string;
  }>;
};

const AuctionPage = async ({ params }: LotsPageProps) => {
  const { auctionId } = await params;

  const [auction, lots] = await Promise.all([
    fetchAuctionByIdServer(auctionId),
    fetchLotsServer(auctionId),
  ]);

  const isLocked = auction.status !== AuctionStatus.CREATED;

  const actions = getAuctionActions(auction);

  const meta = [
    { text: `Created ${formatISODate(auction.createdAt)}` },
    {
      text: auction.finishedAt ? `Finished at ${formatISODate(auction.finishedAt)}` : '',
      isVisible: auction.status === AuctionStatus.FINISHED && !!auction.finishedAt,
    },
    { text: `ID ${auction.id}` },
  ];

  return (
    <>
      <AuctionPageHeader
        back={{ href: '/crm/auctions', label: 'Auctions' }}
        title={auction.name}
        badge={<AuctionStatusBadge status={auction.status} />}
        actions={actions}
        description={auction.description}
        meta={meta}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
            Lots
          </span>
          {lots.length > 0 && <CreateLotButton auctionId={auction.id} disabled={isLocked} />}
        </div>
        <LotsList auctionId={auction.id} lots={lots} isLocked={isLocked} />
      </div>
    </>
  );
};

export default AuctionPage;
