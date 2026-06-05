import HeadedLayout from '@/src/layouts/HeadedLayout';
import { Skeleton } from '@/ui-kit/ui/skeleton';

const ROWS = 5;

export default function ResultsLoading() {
  return (
    <HeadedLayout showControls={false}>
      <div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <Skeleton className="h-9 w-64" />
          </div>
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-3.5 w-40" />
        </div>
        <hr className="border-t mt-4" />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-6 space-y-3">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: ROWS }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </HeadedLayout>
  );
}
