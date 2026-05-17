import { formatISODate } from '@/src/utils/date';
import CreateLotButton from '@/app/crm/auctions/[auctionId]/CreateLot.button';
import LotsList from '@/app/crm/auctions/[auctionId]/LotsList.table';
import StartAuctionButton from '@/app/crm/auctions/[auctionId]/StartAuction.button';
import { fetchAuctionByIdServer } from '@/src/api/auctions-api/requests/auctions';
import { AuctionStatus } from '@/src/api/dto/auction.dto';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/ui-kit/ui/card';
import { Button } from '@/ui-kit/ui/button';
import { BarChart2Icon } from 'lucide-react';
import Link from 'next/link';
import CrmHeader from '@/src/layouts/CrmHeader';

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

          <div className="flex items-center gap-2">
            {auction.status === AuctionStatus.FINISHED && (
              <Button variant="outline" asChild>
                <Link href={`/results/${auction.id}?role=admin`}>
                  <BarChart2Icon className="size-4" />
                  Results
                </Link>
              </Button>
            )}
            {auction.status === AuctionStatus.CREATED && (
              <StartAuctionButton auctionId={auction.id} />
            )}
          </div>
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
        <CrmHeader title="Lots" action={<CreateLotButton auctionId={auction.id} />} />
      </div>

      <LotsList auctionId={auction.id} />
    </div>
  );
};

export default AuctionPage;
