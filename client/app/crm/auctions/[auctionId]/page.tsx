import { fetchAuctionByIdServer } from '@/src/api/requests/server/auctions';
import { formatISODate } from '@/src/utils/date';
import CreateLotButton from '@/app/crm/auctions/[auctionId]/CreateLot.button';
import LotsList from '@/app/crm/auctions/[auctionId]/LotsList.table';
import StartAuctionButton from '@/app/crm/auctions/[auctionId]/StartAuction.button';

type LotsPageProps = {
  params: Promise<{
    auctionId: string;
  }>;
};

const AuctionPage = async ({ params }: LotsPageProps) => {
  const { auctionId } = await params;

  const auction = await fetchAuctionByIdServer(auctionId);

  return (
    <div className="p-8 space-y-8">
      <div className="card p-6 shadow-md rounded-md space-y-2">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{auction.name}</h1>
          <StartAuctionButton auctionId={auction.id} />
        </div>
        {auction.description && <p>{auction.description}</p>}
        <div className="text-sm text-gray-500">
          <p>Created at: {formatISODate(auction.createdAt)}</p>
          <p>ID: {auction.id}</p>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Lots</h2>
          <CreateLotButton auctionId={auction.id} />
        </div>

        <LotsList auctionId={auction.id} />
      </div>
    </div>
  );
};

export default AuctionPage;
