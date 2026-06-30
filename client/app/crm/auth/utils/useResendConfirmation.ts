import { useState } from 'react';
import { useNotification } from '@/src/modules/notifications/NotifcationContext';
import { makeSARequest } from '@/src/api/makeSARequest';
import { resendConfirmationAction } from '@/src/api/actions/auth.actions';
import { is429Error } from '@/src/api/errors';

const resendConfirmation = makeSARequest(resendConfirmationAction);

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
