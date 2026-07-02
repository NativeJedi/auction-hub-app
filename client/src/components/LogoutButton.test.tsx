// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPush, mockShowToast, mockLogout, mockClearAllRoomTokens, mockConfirmModalShow } =
  vi.hoisted(() => ({
    mockPush: vi.fn(),
    mockShowToast: vi.fn(),
    mockLogout: vi.fn(),
    mockClearAllRoomTokens: vi.fn(),
    mockConfirmModalShow: vi.fn(),
  }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/src/modules/notifications/NotifcationContext', () => ({
  useNotification: () => ({ showToast: mockShowToast }),
}));

vi.mock('@/src/api/actions/auth.actions', () => ({
  logoutAction: mockLogout,
}));

vi.mock('@/src/api/makeSARequest', () => ({
  makeSARequest: (fn: (...args: unknown[]) => unknown) => fn,
}));

vi.mock('@/src/modules/room-engine/core/RoomEngine', () => ({
  RoomEngine: { clearAllRoomTokens: mockClearAllRoomTokens },
}));

vi.mock('@/src/modules/modals/ConfirmModal', () => ({
  confirmModal: { show: mockConfirmModalShow },
}));

import LogoutButton from './LogoutButton';

describe('LogoutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('default state: renders a "Log out" button', () => {
    render(<LogoutButton />);

    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
  });

  it('default state: confirmModal.show has not been called', () => {
    render(<LogoutButton />);

    expect(mockConfirmModalShow).not.toHaveBeenCalled();
  });

  it('clicking "Log out" calls confirmModal.show with title and description', async () => {
    const user = userEvent.setup();
    mockConfirmModalShow.mockResolvedValue({ result: 'closed' });
    render(<LogoutButton />);

    await user.click(screen.getByRole('button', { name: /log out/i }));

    await waitFor(() =>
      expect(mockConfirmModalShow).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Log out?', description: expect.any(String) })
      )
    );
  });

  it('when modal is closed (cancelled), logout() is not called', async () => {
    const user = userEvent.setup();
    mockConfirmModalShow.mockResolvedValue({ result: 'closed' });
    render(<LogoutButton />);

    await user.click(screen.getByRole('button', { name: /log out/i }));
    await waitFor(() => expect(mockConfirmModalShow).toHaveBeenCalled());

    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('when confirmed, calls logout()', async () => {
    const user = userEvent.setup();
    mockConfirmModalShow.mockResolvedValue({ result: 'submitted', data: undefined });
    mockLogout.mockResolvedValue(undefined);
    render(<LogoutButton />);

    await user.click(screen.getByRole('button', { name: /log out/i }));

    await waitFor(() => expect(mockLogout).toHaveBeenCalledOnce());
  });

  it('when confirmed, calls RoomEngine.clearAllRoomTokens() on success', async () => {
    const user = userEvent.setup();
    mockConfirmModalShow.mockResolvedValue({ result: 'submitted', data: undefined });
    mockLogout.mockResolvedValue(undefined);
    render(<LogoutButton />);

    await user.click(screen.getByRole('button', { name: /log out/i }));

    await waitFor(() => expect(mockClearAllRoomTokens).toHaveBeenCalledOnce());
  });

  it('when confirmed, calls router.push("/crm/auth") on success', async () => {
    const user = userEvent.setup();
    mockConfirmModalShow.mockResolvedValue({ result: 'submitted', data: undefined });
    mockLogout.mockResolvedValue(undefined);
    render(<LogoutButton />);

    await user.click(screen.getByRole('button', { name: /log out/i }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/crm/auth'));
  });

  it('button shows loading state while logout is in flight', async () => {
    const user = userEvent.setup();
    let resolveLogout!: () => void;
    mockLogout.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveLogout = resolve;
      })
    );
    mockConfirmModalShow.mockResolvedValue({ result: 'submitted', data: undefined });
    render(<LogoutButton />);

    await user.click(screen.getByRole('button', { name: /log out/i }));

    // Button keeps its label (visually hidden behind a spinner) and is disabled while isPending=true
    await waitFor(() => expect(screen.getByRole('button', { name: /log out/i })).toBeDisabled());

    resolveLogout();
  });

  it('on logout error: does NOT call router.push', async () => {
    const user = userEvent.setup();
    mockConfirmModalShow.mockResolvedValue({ result: 'submitted', data: undefined });
    mockLogout.mockRejectedValue(new Error('network error'));
    render(<LogoutButton />);

    await user.click(screen.getByRole('button', { name: /log out/i }));

    await waitFor(() => expect(mockShowToast).toHaveBeenCalled());
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('on logout error: calls showToast with type "error"', async () => {
    const user = userEvent.setup();
    mockConfirmModalShow.mockResolvedValue({ result: 'submitted', data: undefined });
    mockLogout.mockRejectedValue(new Error('network error'));
    render(<LogoutButton />);

    await user.click(screen.getByRole('button', { name: /log out/i }));

    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }))
    );
  });

  it('on logout error: isPending resets to false (button re-enabled)', async () => {
    const user = userEvent.setup();
    mockConfirmModalShow.mockResolvedValue({ result: 'submitted', data: undefined });
    mockLogout.mockRejectedValue(new Error('network error'));
    render(<LogoutButton />);

    await user.click(screen.getByRole('button', { name: /log out/i }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /log out/i })).not.toBeDisabled()
    );
  });
});
