import { fetchAuctionResultsServer } from '@/src/api/auctions-api/requests/auctions';
import { formatISODate } from '@/src/utils/date';
import AuctionPageHeader from '@/src/components/AuctionPageHeader';
import ResultsStats from './components/ResultsStats';
import LotResultsTable from './components/LotResultsTable';
import HeadedLayout from '@/src/layouts/HeadedLayout';

type ResultsPageProps = {
  params: Promise<{ auctionId: string }>;
  searchParams: Promise<{ role?: string }>;
};

const AuctionResultsPage = async ({ params, searchParams }: ResultsPageProps) => {
  const [{ auctionId }, { role }] = await Promise.all([params, searchParams]);

  const results = await fetchAuctionResultsServer(auctionId);
  const isAdmin = role === 'admin';

  return (
    <HeadedLayout showControls={isAdmin}>
      <AuctionPageHeader
        back={
          isAdmin ? { href: `/crm/auctions/${auctionId}`, label: 'Back to auction' } : undefined
        }
        title={results.name}
        description={results.description}
        meta={[
          {
            text: results.finishedAt ? `Finished: ${formatISODate(results.finishedAt)}` : '',
            isVisible: !!results.finishedAt,
          },
        ]}
      />

      <ResultsStats
        totalLots={results.totalLots}
        soldCount={results.soldCount}
        unsoldCount={results.unsoldCount}
        valuesByCurrency={results.valuesByCurrency}
      />

      <LotResultsTable lots={results.lots} />
    </HeadedLayout>
  );
};

export default AuctionResultsPage;
