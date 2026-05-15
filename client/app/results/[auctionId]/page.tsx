import { fetchAuctionResultsServer } from '@/src/api/auctions-api/requests/auctions';
import AuctionResultsHeader from './components/AuctionResultsHeader';
import ResultsStats from './components/ResultsStats';
import LotResultsTable from './components/LotResultsTable';

type ResultsPageProps = {
  params: Promise<{ auctionId: string }>;
  searchParams: Promise<{ role?: string }>;
};

const AuctionResultsPage = async ({ params, searchParams }: ResultsPageProps) => {
  const [{ auctionId }, { role }] = await Promise.all([params, searchParams]);

  const results = await fetchAuctionResultsServer(auctionId);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <AuctionResultsHeader auctionId={auctionId} name={results.name} description={results.description} finishedAt={results.finishedAt} isAdmin={role === 'admin'} />

      <ResultsStats
        totalLots={results.totalLots}
        soldCount={results.soldCount}
        unsoldCount={results.unsoldCount}
        valuesByCurrency={results.valuesByCurrency}
      />

      <LotResultsTable lots={results.lots} />
    </div>
  );
};

export default AuctionResultsPage;
