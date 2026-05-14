import { Card, CardContent, CardHeader } from '@/ui-kit/ui/card';
import { cn } from '@/ui-kit/utils';

const RoomCard = ({
  title,
  tool,
  children,
  className,
}: React.PropsWithChildren<{
  title: string;
  tool?: React.ReactNode;
  className?: string;
}>) => {
  return (
    <Card className={cn('flex flex-col overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between h-12 px-3 border-b space-y-0 flex-shrink-0">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </span>
        {tool}
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {children}
      </CardContent>
    </Card>
  );
};

export default RoomCard;
