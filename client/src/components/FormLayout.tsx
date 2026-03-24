import { Card, CardContent, CardHeader, CardTitle } from '@/ui-kit/ui/card';

type FormLayoutProps = {
  title: string;
  footer?: React.ReactNode;
};

const FormLayout = ({ title, children, footer }: React.PropsWithChildren<FormLayoutProps>) => {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">{title}</CardTitle>
      </CardHeader>

      <CardContent>
        {children}

        {footer && <div className="w-full text-center text-sm text-muted-foreground">{footer}</div>}
      </CardContent>
    </Card>
  );
};

export default FormLayout;
