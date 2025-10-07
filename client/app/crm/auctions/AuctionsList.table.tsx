import Link from 'next/link';
import { formatISODate } from '@/src/utils/date';
import { fetchAuctionsServer } from '@/src/api/requests/server/auctions';
import { Auction, AuctionStatus } from '@/src/api/dto/auction.dto';
import { DeleteAuctionButton } from '@/app/crm/auctions/DeleteAuction.button';
import TableLayout from '@/src/ui/components/TableLayout';

const statusClassMap: Record<Auction['status'], string> = {
  [AuctionStatus.STARTED]: 'badge badge-success',
  [AuctionStatus.CREATED]: 'badge badge-neutral',
  [AuctionStatus.FINISHED]: 'badge badge-error',
};

const getStatusClass = (status: Auction['status']) =>
  statusClassMap[status] || 'badge badge-neutral';

const tableHeaders = [
  { text: 'Name' },
  { text: 'Description' },
  { text: 'Status' },
  { text: 'Created At' },
  { text: 'Actions', centered: true },
];

const AuctionsList = async () => {
  const { items: auctions } = await fetchAuctionsServer();

  return (
    <TableLayout headers={tableHeaders}>
      {auctions.map((auction) => (
        <tr key={auction.id}>
          <td className="p-0">
            <Link
              href={`/crm/auctions/${auction.id}`}
              className="link link-primary block h-full w-full p-4"
            >
              {auction.name}
            </Link>
          </td>

          <td>{auction.description}</td>

          <td>
            <span className={`${getStatusClass(auction.status)} inline-block`}>
              {auction.status}
            </span>
          </td>

          <td>{formatISODate(auction.createdAt)}</td>

          <td className="text-center">
            <DeleteAuctionButton auction={auction} />
          </td>
        </tr>
      ))}
    </TableLayout>
  );
};

export default AuctionsList;
