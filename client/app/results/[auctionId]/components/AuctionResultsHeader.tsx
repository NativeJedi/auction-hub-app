import { Card, CardDescription, CardHeader, CardTitle } from '@/ui-kit/ui/card';
import { formatISODate } from '@/src/utils/date';
import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';

type AuctionResultsHeaderProps = {
  auctionId: string;
  name: string;
  description: string | null;
  finishedAt: string | null;
  isAdmin: boolean;
};

const AuctionResultsHeader = ({ auctionId, name, description, finishedAt, isAdmin }: AuctionResultsHeaderProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          {isAdmin && (
            <Link
              href={`/crm/auctions/${auctionId}`}
              title="Back to auction"
              className="mt-1 shrink-0 rounded-lg p-1.5 bg-muted text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
            >
              <ArrowLeftIcon className="size-4" />
            </Link>
          )}
          <div className="space-y-1">
            <CardTitle className="text-2xl md:text-3xl">{name}</CardTitle>
            {description && <CardDescription className="text-base">{description}</CardDescription>}
            {finishedAt && <p className="text-sm text-muted-foreground">Finished: {formatISODate(finishedAt)}</p>}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};

export default AuctionResultsHeader;
