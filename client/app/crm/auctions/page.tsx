import { CreateAuctionButton } from '@/app/crm/auctions/CreateAuction.button';
import AuctionsList from '@/app/crm/auctions/AuctionsList.table';
import React from 'react';

const AuctionsPage = () => {
  return (
    <>
      <header className="flex flex-row items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Auctions</h1>
        <CreateAuctionButton />
      </header>

      <AuctionsList />
    </>
  );
};

export default AuctionsPage;
