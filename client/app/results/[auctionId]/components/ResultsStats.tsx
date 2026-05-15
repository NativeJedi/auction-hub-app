import { Card, CardContent, CardHeader, CardTitle } from '@/ui-kit/ui/card';

type ResultsStatsProps = {
  totalLots: number;
  soldCount: number;
  unsoldCount: number;
  valuesByCurrency: Record<string, number>;
};

const StatCard = ({ label, value }: { label: string; value: string | number }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-2xl font-bold">{value}</p>
    </CardContent>
  </Card>
);

const formatCurrencyValue = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(
    amount
  );

const ResultsStats = ({
  totalLots,
  soldCount,
  unsoldCount,
  valuesByCurrency,
}: ResultsStatsProps) => {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <StatCard label="Total Lots" value={totalLots} />
      <StatCard label="Sold" value={soldCount} />
      <StatCard label="Unsold" value={unsoldCount} />
      {Object.entries(valuesByCurrency).map(([currency, amount]) => (
        <StatCard
          key={currency}
          label="Value Raised"
          value={formatCurrencyValue(amount, currency)}
        />
      ))}
    </div>
  );
};

export default ResultsStats;
