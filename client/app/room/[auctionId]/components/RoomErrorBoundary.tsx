'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui-kit/ui/card';
import { LucideCircleAlert } from 'lucide-react';
import { Button } from '@/ui-kit/ui/button';

type Props = { children: ReactNode };
type State = { error: Error | null };

const FatalError = ({ children }: React.PropsWithChildren) => (
  <div className="h-screen flex items-center justify-center bg-muted/30">
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-col items-center space-y-4">
        <LucideCircleAlert className="text-destructive" size={48} />
        <CardTitle className="text-center">Something went wrong</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <CardDescription className="text-center">
          {children ?? 'Failed to load room. Please refresh the page.'}
        </CardDescription>
        <Button onClick={() => window.location.reload()}>Refresh</Button>
      </CardContent>
    </Card>
  </div>
);

export class RoomErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('RoomErrorBoundary caught:', error, info);
    // Class boundaries swallow errors — without this Sentry never sees them
    Sentry.captureException(error, {
      extra: { componentStack: info.componentStack },
    });
  }

  render() {
    if (this.state.error) {
      return <FatalError>{this.state.error.message}</FatalError>;
    }
    return this.props.children;
  }
}
