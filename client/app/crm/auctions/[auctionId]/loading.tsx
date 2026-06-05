import { Skeleton } from '@/ui-kit/ui/skeleton';

const ROWS = 5;

export default function AuctionDetailLoading() {
  return (
    <>
      <div>
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-20" />
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-3.5 w-56" />
        </div>
        <hr className="border-t mt-4" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-10" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: ROWS }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </>
  );
}
