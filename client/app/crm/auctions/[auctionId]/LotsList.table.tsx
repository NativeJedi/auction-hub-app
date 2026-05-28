import { DeleteLotButton } from '@/app/crm/auctions/[auctionId]/DeleteLot.button';
import { Lot, LotStatus } from '@/src/api/dto/lot.dto';
import { Auction } from '@/src/api/dto/auction.dto';
import { Badge } from '@/ui-kit/ui/badge';
import { StatusMap } from '@/src/components/StatusBadge';
import { Columns, DataTable } from '@/src/modules/tables';
import ManageLotImagesButton from '@/app/crm/auctions/[auctionId]/ManageLotImages.button';
import CreateLotButton from '@/app/crm/auctions/[auctionId]/CreateLot.button';

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

const getColumns = (auctionId: Auction['id'], isLocked?: boolean): Columns<Lot> => [
  {
    header: 'Name',
    render: (lot) => lot.name,
  },
  {
    header: 'Description',
    className: 'hidden lg:table-cell',
    render: (lot) => lot.description,
  },
  {
    header: 'Status',
    render: (lot) => <LotStatusBadge status={lot.status} />,
  },
  {
    header: 'Currency',
    className: 'hidden md:table-cell',
    render: (lot) => lot.currency,
  },
  {
    header: 'Starting Price',
    className: 'hidden sm:table-cell',
    render: (lot) => lot.startPrice,
  },
  {
    header: 'Sold Price',
    className: 'hidden sm:table-cell',
    render: (lot) => lot.soldPrice ?? '-',
  },
  {
    header: 'Buyer',
    className: 'hidden md:table-cell',
    render: (lot) => <LotBuyerValue lot={lot} />,
  },
  {
    header: 'Actions',
    align: 'center',
    render: (lot) => (
      <>
        <DeleteLotButton auctionId={auctionId} lot={lot} disabled={isLocked} />
        <ManageLotImagesButton auctionId={auctionId} lot={lot} disabled={isLocked} />
      </>
    ),
  },
];

type Props = {
  auctionId: Auction['id'];
  lots: Lot[];
  isLocked?: boolean;
};

const LotsList = ({ auctionId, lots, isLocked }: Props) => {
  const columns = getColumns(auctionId, isLocked);

  const emptyState = (
    <>
      <p className="text-sm text-muted-foreground">No lots yet</p>
      <CreateLotButton auctionId={auctionId} disabled={isLocked}>
        Create
      </CreateLotButton>
    </>
  );

  return <DataTable data={lots} columns={columns} emptyState={emptyState} />;
};

export default LotsList;
