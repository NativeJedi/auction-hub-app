import { formatISODate } from '@/src/utils/date';
import CreateLotButton from '@/app/crm/auctions/[auctionId]/CreateLot.button';
import LotsList from '@/app/crm/auctions/[auctionId]/LotsList.table';
import StartAuctionButton from '@/app/crm/auctions/[auctionId]/StartAuction.button';
import { fetchAuctionByIdServer } from '@/src/api/auctions-api/requests/auctions';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/ui-kit/ui/card';
import PageHeader from '@/src/layouts/PageHeader';

type LotsPageProps = {
  params: Promise<{
    auctionId: string;
  }>;
};

const AuctionPage = async ({ params }: LotsPageProps) => {
  const { auctionId } = await params;

  const auction = await fetchAuctionByIdServer(auctionId);

  return (
    <div className="space-y-8 p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-3xl">{auction.name}</CardTitle>

          <StartAuctionButton auctionId={auction.id} />
        </CardHeader>

        <CardContent className="space-y-4">
          {auction.description && (
            <CardDescription className="text-base text-foreground">
              {auction.description}
            </CardDescription>
          )}

          <div className="text-sm text-muted-foreground">
            <p>Created at: {formatISODate(auction.createdAt)}</p>
            <p>ID: {auction.id}</p>
          </div>
        </CardContent>
      </Card>

      <div className="pl-6 pr-6">
        <PageHeader title="Lots" action={<CreateLotButton auctionId={auction.id} />} />
      </div>

      <LotsList auctionId={auction.id} />
    </div>
  );
};

export default AuctionPage;
