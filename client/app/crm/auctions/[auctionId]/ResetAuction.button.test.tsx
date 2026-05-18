// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockRouter, mockOnError, mockConfirmModal, mockResetAuction } = vi.hoisted(() => ({
  mockRouter: { refresh: vi.fn() },
  mockOnError: vi.fn(),
  mockConfirmModal: { show: vi.fn() },
  mockResetAuction: vi.fn(),
}));

vi.mock('@/src/api/auctions-api-client/requests/room', () => ({
  resetAuction: mockResetAuction,
}));

vi.mock('@/src/modules/modals/ConfirmModal', () => ({
  confirmModal: mockConfirmModal,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

vi.mock('@/src/modules/notifications/NotifcationContext', () => ({
  useErrorNotification: () => mockOnError,
}));

import ResetAuctionButton from './ResetAuction.button';

describe('ResetAuctionButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResetAuction.mockResolvedValue(undefined);
  });

  it('shows confirmation modal when Reset button is clicked', async () => {
    const user = userEvent.setup();
    mockConfirmModal.show.mockResolvedValue({ result: 'closed' });

    render(<ResetAuctionButton auctionId="auction-1" />);
    await user.click(screen.getByRole('button', { name: /reset/i }));

    await waitFor(() => {
      expect(mockConfirmModal.show).toHaveBeenCalledWith({
        title: 'Reset Auction?',
        description: expect.stringContaining('clear all bids'),
      });
    });
  });

  it('calls resetAuction and router.refresh on confirm', async () => {
    const user = userEvent.setup();
    mockConfirmModal.show.mockResolvedValue({ result: 'submitted', data: undefined });

    render(<ResetAuctionButton auctionId="auction-1" />);
    await user.click(screen.getByRole('button', { name: /reset/i }));

    await waitFor(() => {
      expect(mockResetAuction).toHaveBeenCalledWith({ auctionId: 'auction-1' });
      expect(mockRouter.refresh).toHaveBeenCalled();
    });
  });

  it('disables the button while resetting', async () => {
    const user = userEvent.setup();
    let resolveReset!: () => void;
    mockResetAuction.mockImplementation(
      () => new Promise<void>((resolve) => { resolveReset = resolve; }),
    );
    mockConfirmModal.show.mockResolvedValue({ result: 'submitted', data: undefined });

    render(<ResetAuctionButton auctionId="auction-1" />);
    await user.click(screen.getByRole('button', { name: /reset/i }));

    await waitFor(() => expect(screen.getByRole('button', { name: /loading/i })).toBeDisabled());

    resolveReset();
    await waitFor(() => expect(screen.getByRole('button', { name: /reset/i })).toBeEnabled());
  });

  it('does not call resetAuction when modal is cancelled', async () => {
    const user = userEvent.setup();
    mockConfirmModal.show.mockResolvedValue({ result: 'closed' });

    render(<ResetAuctionButton auctionId="auction-1" />);
    await user.click(screen.getByRole('button', { name: /reset/i }));

    await waitFor(() => expect(mockConfirmModal.show).toHaveBeenCalled());
    expect(mockResetAuction).not.toHaveBeenCalled();
    expect(mockRouter.refresh).not.toHaveBeenCalled();
  });

  it('calls useErrorNotification on resetAuction failure', async () => {
    const user = userEvent.setup();
    const error = new Error('Reset failed');
    mockConfirmModal.show.mockResolvedValue({ result: 'submitted', data: undefined });
    mockResetAuction.mockRejectedValue(error);

    render(<ResetAuctionButton auctionId="auction-1" />);
    await user.click(screen.getByRole('button', { name: /reset/i }));

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(error);
    });
    expect(mockRouter.refresh).not.toHaveBeenCalled();
  });
});
