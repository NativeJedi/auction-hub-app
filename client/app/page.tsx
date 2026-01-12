import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from '@/src/services/session/constants';

export default async function RootPage() {
  const requestCookies = await cookies();

  const sessionId = requestCookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    redirect('/crm/auth');
  }

  redirect('/crm/auctions');
}
