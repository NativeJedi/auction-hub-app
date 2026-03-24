import { DeleteLotButton } from '@/app/crm/auctions/[auctionId]/DeleteLot.button';
import { Lot, LotStatus } from '@/src/api/dto/lot.dto';
import { Auction } from '@/src/api/dto/auction.dto';
import { fetchLotsServer } from '@/src/api/auctions-api/requests/lots';
import { Badge } from '@/ui-kit/ui/badge';
import { StatusMap } from '@/src/components/StatusBadge';
import { Columns, DataTable } from '@/src/modules/tables';
import ManageLotImagesButton from '@/app/crm/auctions/[auctionId]/ManageLotImages.button';

const LotBuyerValue = ({ lot }: { lot: Lot }) => {
  if (!lot.buyer) return '-';

  return (
    <div className="flex flex-col">
      <span className="font-medium">{lot.buyer.name}</span>
      <span className="text-muted-foreground text-sm">{lot.buyer.email}</span>
    </div>
  );
};

const LotStatusBadge = ({ status }: { status: LotStatus }) => {
  const variantMap: StatusMap<LotStatus> = {
    [LotStatus.CREATED]: 'default',
    [LotStatus.SOLD]: 'success',
    [LotStatus.UNSOLD]: 'error',
  };

  return <Badge variant={variantMap[status]}>{status}</Badge>;
};

const getColumns = (auctionId: Auction['id']): Columns<Lot> => [
  {
    header: 'Name',
    render: (lot) => lot.name,
  },
  {
    header: 'Description',
    render: (lot) => lot.description,
  },
  {
    header: 'Status',
    render: (lot) => <LotStatusBadge status={lot.status} />,
  },
  {
    header: 'Currency',
    render: (lot) => lot.currency,
  },
  {
    header: 'Starting Price',
    render: (lot) => lot.startPrice,
  },
  {
    header: 'Sold Price',
    render: (lot) => lot.soldPrice ?? '-',
  },
  {
    header: 'Buyer',
    render: (lot) => <LotBuyerValue lot={lot} />,
  },
  {
    header: 'Actions',
    align: 'center',
    render: (lot) => (
      <>
        <DeleteLotButton auctionId={auctionId} lot={lot} />
        <ManageLotImagesButton auctionId={auctionId} lot={lot} />
      </>
    ),
  },
];

const LotsList = async ({ auctionId }: { auctionId: Auction['id'] }) => {
  const lots = await fetchLotsServer(auctionId);

  const columns = getColumns(auctionId);

  return <DataTable data={lots} columns={columns} />;
};

export default LotsList;
