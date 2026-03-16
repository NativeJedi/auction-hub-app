'use client';

import { useState } from 'react';
import { useRoomId } from '@/app/room/[roomId]/hooks';
import { useErrorNotification } from '@/src/modules/notifications/NotifcationContext';
import { sendRoomInvite } from '@/src/api/auctions-api-client/requests/room';
import FormLayout from '@/src/components/form/FormLayout';
import TextField from '@/src/components/form/fields/TextField';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui-kit/ui/card';
import { LucideCircleCheck } from 'lucide-react';

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

const InviteForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [form, setForm] = useState({ name: '', email: '' });
  const showError = useErrorNotification();

  const roomId = useRoomId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await sendRoomInvite(roomId, form);

      onSuccess();
    } catch (error) {
      console.error(error);
      showError(error);
    }
  };

  return (
    <FormLayout title="Registration for auction" submitLabel="Send invite" onSubmit={handleSubmit}>
      <TextField
        label="Name"
        placeholder="Name"
        id="name"
        onChange={(name) => setForm({ ...form, name })}
      />

      <TextField
        label="Email"
        placeholder="Email"
        id="email"
        onChange={(email) => setForm({ ...form, email })}
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
