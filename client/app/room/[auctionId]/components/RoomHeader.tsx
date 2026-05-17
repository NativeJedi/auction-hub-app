import { Skeleton } from '@/ui-kit/ui/skeleton';

type Props = React.PropsWithChildren<{ title?: string; description?: string; isLoading?: boolean }>;

const RoomHeaderSkeleton = () => (
  <header className="bg-background border-b px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-3 flex-shrink-0">
    <div className="min-w-0 flex flex-col gap-1.5">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-72" />
    </div>
  </header>
);

const RoomHeader = ({ title, description, children, isLoading }: Props) => {
  if (isLoading) return <RoomHeaderSkeleton />;

  return (
    <header className="bg-background border-b px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-3 flex-shrink-0">
      <div className="min-w-0">
        <p className="text-base sm:text-lg font-medium truncate">{title}</p>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">{description}</p>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </header>
  );
};

export default RoomHeader;
