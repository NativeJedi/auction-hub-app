import { CreateAuctionButton } from '@/app/crm/auctions/CreateAuction.button';
import AuctionsList from '@/app/crm/auctions/AuctionsList.table';
import PageHeader from '@/src/layouts/PageHeader';

const AuctionsPage = () => {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Auctions" action={<CreateAuctionButton />} />

      <AuctionsList />
    </div>
  );
};

export default AuctionsPage;
