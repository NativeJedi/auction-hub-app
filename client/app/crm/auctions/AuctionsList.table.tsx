import Link from 'next/link';
import { formatISODate } from '@/src/utils/date';
import { Auction } from '@/src/api/dto/auction.dto';
import { DeleteAuctionButton } from '@/app/crm/auctions/DeleteAuction.button';
import { fetchAuctionsServer } from '@/src/api/auctions-api/requests/auctions';
import AuctionStatusBadge from '@/app/crm/auctions/Auction.status';
import { Columns, DataTable } from '@/src/components/DataTable';

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
    render: (auction) => auction.description,
  },
  {
    header: 'Status',
    render: (auction) => <AuctionStatusBadge status={auction.status} />,
  },
  {
    header: 'Created At',
    render: (auction) => formatISODate(auction.createdAt),
  },
  {
    header: 'Actions',
    align: 'center',
    render: (auction) => <DeleteAuctionButton auction={auction} />,
  },
];

const AuctionsList = async () => {
  const { items } = await fetchAuctionsServer();

  return <DataTable data={items} columns={columns} />;
};

export default AuctionsList;
