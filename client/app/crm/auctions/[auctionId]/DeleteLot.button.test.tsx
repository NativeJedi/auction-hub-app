// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/src/modules/modals/ConfirmModal', () => ({
  confirmModal: { show: vi.fn() },
}));

vi.mock('@/src/api/auctions-api-client/requests/lots', () => ({
  deleteLot: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('@/src/modules/notifications/NotifcationContext', () => ({
  useErrorNotification: () => vi.fn(),
  useNotification: () => ({ showToast: vi.fn() }),
}));

import { DeleteLotButton } from './DeleteLot.button';

const lot = { id: 'lot-1', name: 'Watch' } as any;

describe('DeleteLotButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders as a disabled button when disabled prop is true', () => {
    render(<DeleteLotButton lot={lot} auctionId="auction-1" disabled={true} />);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders as an enabled button when disabled prop is false', () => {
    render(<DeleteLotButton lot={lot} auctionId="auction-1" disabled={false} />);

    expect(screen.getByRole('button')).not.toBeDisabled();
  });
});
