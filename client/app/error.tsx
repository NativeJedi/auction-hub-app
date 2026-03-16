'use client';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isUnauthorizedError } from '@/src/utils/errors';
import { useEffect } from 'react';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/ui-kit/ui/card';
import { Button } from '@/ui-kit/ui/button';

interface ErrorProps {
  error: any;
  reset: () => void; // reset працює лише при client component
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    if (isUnauthorizedError(error)) {
      redirect('/crm/auth');
    }
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-5xl mb-2">😵</CardTitle>
          <CardTitle className="text-2xl">Something went wrong</CardTitle>
          <CardDescription className="text-md">
            {error?.message || 'Unknown error occurred.'}
          </CardDescription>
        </CardHeader>

        <CardFooter className="flex justify-center gap-3">
          <Button onClick={reset}>Retry</Button>

          <Button variant="outline" asChild>
            <Link href="/crm/auth">Go login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
