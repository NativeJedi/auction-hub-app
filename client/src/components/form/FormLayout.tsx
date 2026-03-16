'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/ui-kit/ui/card';
import { Button } from '@/ui-kit/ui/button';

type FormLayoutProps = {
  title: string;
  footer?: React.ReactNode;
  submitLabel: string;
  onSubmit: (e: React.FormEvent) => void;
};

const FormLayout = ({
  title,
  children,
  footer,
  submitLabel,
  onSubmit,
}: React.PropsWithChildren<FormLayoutProps>) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">{title}</CardTitle>
      </CardHeader>

      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {children}

          <Button type="submit" className="w-full">
            {submitLabel}
          </Button>
        </form>

        {footer && <div className="w-full text-center text-sm text-muted-foreground">{footer}</div>}
      </CardContent>
    </Card>
  );
};

export default FormLayout;
