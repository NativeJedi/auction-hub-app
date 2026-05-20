// @vitest-environment jsdom
import { describe, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/src/modules/notifications/NotifcationContext', () => ({
  useNotification: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/src/api/auctions-api-client/requests/auth', () => ({
  logout: vi.fn(),
}));

vi.mock('@/src/modules/room-engine/core/RoomEngine', () => ({
  RoomEngine: { clearAllRoomTokens: vi.fn() },
}));

import LogoutButton from './LogoutButton';

const _component = LogoutButton;

describe('LogoutButton', () => {
  it.todo('default state: renders a "Log out" button');
  it.todo('default state: confirmation UI is not visible');
  it.todo('clicking "Log out" shows confirmation UI with "Log out?", Confirm, and Cancel');
  it.todo('clicking Cancel returns to default state');
  it.todo('clicking Confirm calls logout() from api-client');
  it.todo('clicking Confirm calls RoomEngine.clearAllRoomTokens() on success');
  it.todo('clicking Confirm calls router.push("/crm/auth") on success');
  it.todo('Confirm button shows loading state while logout is in flight');
  it.todo('on logout error: does NOT call router.push');
  it.todo('on logout error: calls showToast with type "error"');
  it.todo('on logout error: isPending resets to false');
});
