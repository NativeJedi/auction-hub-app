import { useState } from 'react';
import { is429Error } from '@/app/crm/auth/utils/errors';
import { useNotification } from '@/src/modules/notifications/NotifcationContext';
import { resendConfirmation } from '@/src/api/auctions-api-client/requests/auth';

export const useResendConfirmation = () => {
  const { showToast } = useNotification();
  const [isLoading, setIsLoading] = useState(false);

  const resendEmailConfirmation = (email: string) => {
    setIsLoading(true);
    return resendConfirmation(email)
      .then(() => showToast({ type: 'success', message: 'New confirmation link sent.' }))
      .catch((error) =>
        showToast({
          type: 'error',
          message: is429Error(error)
            ? 'Too many requests — please wait before trying again.'
            : 'Failed to resend the confirmation email.',
        })
      )
      .finally(() => setIsLoading(false));
  };

  return { resendEmailConfirmation, isLoading };
};
