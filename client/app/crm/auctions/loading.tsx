import { Skeleton } from '@/ui-kit/ui/skeleton';

const ROWS = 5;

export default function AuctionsLoading() {
  return (
    <>
      <header className="flex flex-row items-center justify-between">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-32" />
      </header>

      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: ROWS }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </>
  );
}
