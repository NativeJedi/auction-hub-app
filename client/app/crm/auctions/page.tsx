import { CreateAuctionButton } from '@/app/crm/auctions/CreateAuction.button';
import AuctionsList from '@/app/crm/auctions/AuctionsList.table';
import CrmHeader from '@/src/layouts/CrmHeader';

const AuctionsPage = () => {
  return (
    <div className="p-6 space-y-6">
      <CrmHeader title="Auctions" action={<CreateAuctionButton />} />

      <AuctionsList />
    </div>
  );
};

export default AuctionsPage;
