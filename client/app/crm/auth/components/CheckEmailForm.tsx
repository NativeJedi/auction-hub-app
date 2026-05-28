'use client';

import { MailOpen } from 'lucide-react';
import { Button } from '@/ui-kit/ui/button';
import { useResendConfirmation } from '@/app/crm/auth/utils/useResendConfirmation';
import { useQueryParam } from '@/src/utils/url';

function CheckEmailForm() {
  const { resendEmailConfirmation, isLoading } = useResendConfirmation();

  const pendingParam = useQueryParam('pending');
  const pendingEmail = pendingParam ? decodeURIComponent(pendingParam) : null;

  if (!pendingEmail) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-5 py-2 text-center">
      <MailOpen className="h-12 w-12 text-primary" />
      <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
        <p>
          We sent a confirmation link to{' '}
          <span className="text-base font-semibold text-primary">{pendingEmail}</span>
        </p>
        <p>Click it to activate your account.</p>
      </div>
      <Button
        variant="outline"
        className="w-full"
        loading={isLoading}
        onClick={() => resendEmailConfirmation(pendingEmail)}
      >
        Resend confirmation email
      </Button>
      <p className="text-xs">The link expires in 24 hours.</p>
    </div>
  );
}

export default CheckEmailForm;
