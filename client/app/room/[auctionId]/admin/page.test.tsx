// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Shared mock state (vi.hoisted so factories can reference these) ──────────
const { mockEngine, mockRouter, mockOnError, mockConfirmModal } = vi.hoisted(() => ({
  mockEngine: {
    resetAuction: vi.fn().mockResolvedValue(undefined),
    finishAuction: vi.fn(),
    nextLot: vi.fn(),
    isLastLot: true,
  },
  mockRouter: { push: vi.fn() },
  mockOnError: vi.fn(),
  mockConfirmModal: { show: vi.fn() },
}));

// ── Module mocks ─────────────────────────────────────────────────────────────
vi.mock('@/src/modules/room-engine/admin/hooks/useAdminRoom', () => ({
  useAdminRoom: () => ({
    engine: mockEngine,
    isLoading: false,
    auction: null,
    activeLot: null,
    lots: [],
    bids: [],
    members: [],
    invites: [],
    isLastLot: mockEngine.isLastLot,
  }),
}));

vi.mock('@/src/modules/room-engine/admin/AdminRoomContext', () => ({
  AdminRoomProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/app/room/[auctionId]/components/RoomErrorBoundary', () => ({
  RoomErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/app/room/[auctionId]/components/RoomHeader', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('./LotStrip', () => ({ default: () => null }));
vi.mock('@/app/room/[auctionId]/admin/Participants', () => ({ default: () => null }));
vi.mock('@/app/room/[auctionId]/components/CurrentLot', () => ({ default: () => null }));
vi.mock('@/app/room/[auctionId]/components/Bids', () => ({ default: () => null }));

vi.mock('@/src/modules/modals/ConfirmModal', () => ({
  confirmModal: mockConfirmModal,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

vi.mock('@/src/modules/notifications/NotifcationContext', () => ({
  useErrorNotification: () => mockOnError,
}));

vi.mock('@/app/room/[auctionId]/hooks', () => ({
  useAuctionId: () => 'auction-1',
}));

// ── Tests ────────────────────────────────────────────────────────────────────
import AdminPage from './page';

describe('RoomAdminPage handleReset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEngine.resetAuction.mockResolvedValue(undefined);
  });

  it('shows confirmation modal when Reset Auction button is clicked', async () => {
    // DoD: Clicking Reset shows the confirmation modal with the data-loss description
    const user = userEvent.setup();
    mockConfirmModal.show.mockResolvedValue({ result: 'closed' });

    render(<AdminPage />);
    await user.click(screen.getByRole('button', { name: /reset auction/i }));

    await waitFor(() => {
      expect(mockConfirmModal.show).toHaveBeenCalledWith({
        title: 'Reset Auction?',
        description: expect.stringContaining('clear all bids'),
      });
    });
  });

  it('navigates to /room/:auctionId after confirming the reset', async () => {
    // DoD: Confirming resets the auction and navigates to /room/:auctionId
    const user = userEvent.setup();
    mockConfirmModal.show.mockResolvedValue({ result: 'submitted', data: undefined });

    render(<AdminPage />);
    await user.click(screen.getByRole('button', { name: /reset auction/i }));

    await waitFor(() => {
      expect(mockEngine.resetAuction).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith('/room/auction-1');
    });
  });

  it('does not navigate when the confirmation modal is cancelled (result === closed)', async () => {
    // DoD: Cancelling the confirmation leaves the auction unchanged
    const user = userEvent.setup();
    mockConfirmModal.show.mockResolvedValue({ result: 'closed' });

    render(<AdminPage />);
    await user.click(screen.getByRole('button', { name: /reset auction/i }));

    await waitFor(() => expect(mockConfirmModal.show).toHaveBeenCalled());
    expect(mockEngine.resetAuction).not.toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('calls useErrorNotification on engine.resetAuction failure', async () => {
    // DoD: API errors are surfaced via useErrorNotification
    const user = userEvent.setup();
    const error = new Error('Reset failed');
    mockConfirmModal.show.mockResolvedValue({ result: 'submitted', data: undefined });
    mockEngine.resetAuction.mockRejectedValue(error);

    render(<AdminPage />);
    await user.click(screen.getByRole('button', { name: /reset auction/i }));

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(error);
    });
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});
