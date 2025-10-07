import { DeleteLotButton } from '@/app/crm/auctions/[auctionId]/DeleteLot.button';
import TableLayout from '@/src/ui/components/TableLayout';
import { fetchLotsServer } from '@/src/api/requests/server/lots';
import { Lot, LotStatus } from '@/src/api/dto/lot.dto';
import { Auction } from '@/src/api/dto/auction.dto';

const headers = [
  {
    text: 'Name',
  },
  {
    text: 'Description',
  },
  {
    text: 'Status',
  },
  {
    text: 'Currency',
  },
  {
    text: 'Starting Price',
  },
  {
    text: 'Sold Price',
  },
  {
    text: 'Buyer',
  },
  {
    text: 'Actions',
    centered: true,
  },
];

const LotStatusesMap: Record<LotStatus, string> = {
  sold: 'badge badge-success',
  created: 'badge badge-neutral',
  unsold: 'badge badge-error',
};

const getStatusClass = (status: LotStatus) => {
  return LotStatusesMap[status] || 'badge badge-neutral';
};

const LotBuyerValue = ({ lot }: { lot: Lot }) => {
  if (!lot.buyer) return '-';

  return (
    <div>
      <div>
        <b>{lot.buyer.name}</b>
      </div>
      <div>{lot.buyer.email}</div>
    </div>
  );
};

const LotsList = async ({ auctionId }: { auctionId: Auction['id'] }) => {
  const lots = await fetchLotsServer(auctionId);

  return (
    <TableLayout headers={headers}>
      {lots.map((lot) => (
        <tr key={lot.id}>
          <td>{lot.name}</td>
          <td>{lot.description}</td>
          <td>
            <span className={`${getStatusClass(lot.status)} inline-block`}>{lot.status}</span>
          </td>
          <td>{lot.currency}</td>
          <td>{lot.startPrice}</td>
          <td>{lot.soldPrice ?? '-'}</td>
          <td>
            <LotBuyerValue lot={lot} />
          </td>
          <td className="text-center">
            <DeleteLotButton auctionId={auctionId} lot={lot} />
          </td>
        </tr>
      ))}
    </TableLayout>
  );
};

export default LotsList;
