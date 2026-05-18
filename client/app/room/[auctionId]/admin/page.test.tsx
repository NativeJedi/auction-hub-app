// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/src/modules/room-engine/admin/hooks/useAdminRoom', () => ({
  useAdminRoom: () => ({
    engine: { finishAuction: vi.fn(), nextLot: vi.fn() },
    isLoading: false,
    auction: null,
    activeLot: null,
    lots: [],
    bids: [],
    members: [],
    invites: [],
    isLastLot: true,
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

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/app/room/[auctionId]/hooks', () => ({
  useAuctionId: () => 'auction-1',
}));

import AdminPage from './page';

describe('AdminPage', () => {
  it('renders without crashing', () => {
    render(<AdminPage />);
    expect(screen.getByRole('button', { name: /finish auction/i })).toBeInTheDocument();
  });
});
