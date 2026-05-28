import { CreateAuctionButton } from '@/app/crm/auctions/CreateAuction.button';
import AuctionsList from '@/app/crm/auctions/AuctionsList.table';
import { fetchAuctionsServer } from '@/src/api/auctions-api/requests/auctions';

const AuctionsPage = async () => {
  const { items } = await fetchAuctionsServer();

  return (
    <>
      <header className="flex flex-row items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Auctions</h1>
        {items.length > 0 && <CreateAuctionButton />}
      </header>

      <AuctionsList items={items} />
    </>
  );
};

export default AuctionsPage;
