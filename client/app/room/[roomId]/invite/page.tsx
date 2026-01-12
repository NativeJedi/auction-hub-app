'use client';

import { useState } from 'react';
import { useRoomId } from '@/app/room/[roomId]/hooks';
import { useErrorNotification } from '@/src/modules/notifications/NotifcationContext';
import { sendRoomInvite } from '@/src/api/auctions-api-client/requests/room';

const InvitePage = () => {
  const [invited, setInvited] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });
  const [isLoading, setIsLoading] = useState(false);
  const showError = useErrorNotification();

  const roomId = useRoomId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      await sendRoomInvite(roomId, form);

      setInvited(true);
    } catch (error) {
      console.error(error);
      showError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-base-200">
      <div className="card bg-base-100 shadow-lg p-8 w-full max-w-md">
        {!invited ? (
          <>
            <h1 className="text-2xl font-bold mb-6">Invite user</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input input-bordered w-full"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input input-bordered w-full"
                required
              />
              <button disabled={isLoading} type="submit" className="btn btn-primary w-full">
                Send invite
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Invite sent!</h2>
            <p className="opacity-80">An invitation was sent to {form.email}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitePage;
