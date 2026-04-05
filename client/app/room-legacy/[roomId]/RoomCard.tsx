import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui-kit/ui/card';

type Props = {
  title?: string;
  description?: string;
};

const RoomCard = ({ title, description, children }: React.PropsWithChildren<Props>) => {
  const isHeaderExists = Boolean(title || description);

  return (
    <Card className="bg-base-100 shadow h-full flex-1 overflow-y-auto space-y-2 p-6">
      {isHeaderExists && (
        <CardHeader className="p-0 space-y-2">
          {title && <CardTitle className="text-xl font-bold">{title}</CardTitle>}
          {description && (
            <CardDescription className="text-sm opacity-80">{description}</CardDescription>
          )}
        </CardHeader>
      )}

      <CardContent className="p-0 space-y-2">{children}</CardContent>
    </Card>
  );
};

export default RoomCard;
