'use client';

import { useState } from 'react';
import { useRoomId } from '@/app/room/[roomId]/hooks';
import { useErrorNotification } from '@/src/modules/notifications/NotifcationContext';
import { sendRoomInvite } from '@/src/api/auctions-api-client/requests/room';
import FormLayout from '@/src/components/FormLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui-kit/ui/card';
import { LucideCircleCheck } from 'lucide-react';
import { FormBuilder, FormField } from '@/src/modules/forms';
import { z } from 'zod';

const SuccessInviteMessage = () => {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-col items-center space-y-4">
        <LucideCircleCheck className="text-success" size={48} />

        <CardTitle className="text-center">Invite sent</CardTitle>
      </CardHeader>

      <CardContent>
        <CardDescription>
          The invite has been sent to your email. Please open the email and follow the instructions.
        </CardDescription>
      </CardContent>
    </Card>
  );
};

const validationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
});

type FormFields = {
  name: string;
  email: string;
};

const fields: FormField[] = [
  { name: 'name', type: 'text', label: 'Name', placeholder: 'Name' },
  { name: 'email', type: 'email', label: 'Email', placeholder: 'Email' },
];

const InviteForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const showError = useErrorNotification();

  const roomId = useRoomId();

  const handleSubmit = async (values: FormFields) => {
    try {
      await sendRoomInvite(roomId, values);

      onSuccess();
    } catch (error) {
      showError(error);
    }
  };

  return (
    <FormLayout title="Registration for auction">
      <FormBuilder<FormFields>
        schema={validationSchema}
        fields={fields}
        onSubmit={handleSubmit}
        submitLabel="Send invite"
      />
    </FormLayout>
  );
};

const InvitePage = () => {
  const [invited, setInvited] = useState(false);

  return (
    <div className="h-screen flex items-center justify-center bg-base-200">
      {invited ? <SuccessInviteMessage /> : <InviteForm onSuccess={() => setInvited(true)} />}
    </div>
  );
};

export default InvitePage;
