import Link from 'next/link';
import { formatISODate } from '@/src/utils/date';
import { Auction } from '@/src/api/dto/auction.dto';
import { DeleteAuctionButton } from '@/app/crm/auctions/DeleteAuction.button';
import AuctionStatusBadge from '@/app/crm/auctions/Auction.status';
import { CreateAuctionButton } from '@/app/crm/auctions/CreateAuction.button';
import { Columns, DataTable } from '@/src/modules/tables';

const columns: Columns<Auction> = [
  {
    header: 'Name',
    render: (auction) => (
      <Link href={`/crm/auctions/${auction.id}`} className="text-primary underline">
        {auction.name}
      </Link>
    ),
  },
  {
    header: 'Description',
    className: 'hidden sm:table-cell',
    render: (auction) => auction.description,
  },
  {
    header: 'Status',
    render: (auction) => <AuctionStatusBadge status={auction.status} />,
  },
  {
    header: 'Created At',
    className: 'hidden md:table-cell',
    render: (auction) => formatISODate(auction.createdAt),
  },
  {
    header: 'Actions',
    align: 'center',
    render: (auction) => <DeleteAuctionButton auction={auction} />,
  },
];

type Props = {
  items: Auction[];
};

const emptyState = (
  <>
    <p className="text-sm text-muted-foreground">No auctions yet</p>
    <CreateAuctionButton />
  </>
);

const AuctionsList = ({ items }: Props) => {
  return <DataTable data={items} columns={columns} emptyState={emptyState} />;
};

export default AuctionsList;
