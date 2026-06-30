// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockCreateLotsAction } = vi.hoisted(() => ({
  mockCreateLotsAction: vi.fn(),
}));

vi.mock('@/src/api/actions/lots.actions', () => ({
  createLotsAction: mockCreateLotsAction,
}));

// Radix Select does not work in jsdom; replace with a native <select> so
// userEvent.selectOptions() and getByLabelText() both work.
vi.mock('@/ui-kit/ui/select', () => ({
  Select: ({ children, onValueChange, value, disabled, id }: any) => (
    <select
      id={id}
      value={value ?? ''}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onValueChange(e.target.value)}
      disabled={disabled}
    >
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

import CreateLotForm from './CreateLotForm';

const defaultProps = {
  auctionId: 'auction-1',
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  onError: vi.fn(),
};

describe('CreateLotForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields', () => {
    render(<CreateLotForm {...defaultProps} />);

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Currency')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Start Price')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
  });

  it('calls onSubmit with form data on valid submission', async () => {
    const user = userEvent.setup();
    const lot = { id: 'lot-1', name: 'Watch' } as any;
    mockCreateLotsAction.mockResolvedValue({ status: 200, data: [lot] });

    render(<CreateLotForm {...defaultProps} />);

    await user.type(screen.getByLabelText('Name'), 'Watch');
    await user.type(screen.getByPlaceholderText('Start Price'), '1000');
    await user.selectOptions(screen.getByLabelText('Currency'), 'UAH');
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(mockCreateLotsAction).toHaveBeenCalledWith(
        'auction-1',
        expect.objectContaining({ name: 'Watch', currency: 'UAH' })
      );
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(lot);
    });
  });

  it('shows validation errors for empty required fields', async () => {
    const user = userEvent.setup();
    render(<CreateLotForm {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
    expect(mockCreateLotsAction).not.toHaveBeenCalled();
  });

  it('calls onError when the action returns a failure status', async () => {
    const user = userEvent.setup();
    mockCreateLotsAction.mockResolvedValue({
      status: 500,
      message: 'Network error',
      reason: 'Error',
    });

    render(<CreateLotForm {...defaultProps} />);

    await user.type(screen.getByLabelText('Name'), 'Watch');
    await user.type(screen.getByPlaceholderText('Start Price'), '1000');
    await user.selectOptions(screen.getByLabelText('Currency'), 'UAH');
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(defaultProps.onError).toHaveBeenCalledTimes(1);
    });
    const error = defaultProps.onError.mock.calls[0][0] as Error;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Network error');
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });
});
