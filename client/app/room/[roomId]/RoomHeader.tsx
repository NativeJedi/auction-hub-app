import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui-kit/ui/card';

type Props = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

const RoomHeader = ({ title, description, action }: Props) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0">
      <CardTitle className="text-3xl">
        <h1>{title}</h1>
      </CardTitle>

      {action}
    </CardHeader>

    {description && (
      <CardContent>
        <CardDescription className="text-base text-foreground">{description}</CardDescription>
      </CardContent>
    )}
  </Card>
);

export default RoomHeader;
