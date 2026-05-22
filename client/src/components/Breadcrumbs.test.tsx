// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { BreadcrumbEntry } from './Breadcrumbs';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import Breadcrumbs from './Breadcrumbs';

const singleItem: BreadcrumbEntry[] = [{ label: 'Home' }];
const twoItems: BreadcrumbEntry[] = [
  { label: 'Auctions', href: '/crm/auctions' },
  { label: 'Summer Art Auction 2025' },
];

describe('Breadcrumbs', () => {
  it('renders a <nav aria-label="breadcrumb"> element', () => {
    render(<Breadcrumbs items={singleItem} />);

    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
  });

  it('renders the correct number of <li> elements', () => {
    render(<Breadcrumbs items={twoItems} />);

    // BreadcrumbSeparator renders as <li role="presentation"> which is excluded from 'listitem' role
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('renders an empty list without throwing when items is an empty array', () => {
    expect(() => render(<Breadcrumbs items={[]} />)).not.toThrow();
  });

  it('last item has aria-current="page" attribute', () => {
    render(<Breadcrumbs items={twoItems} />);

    // BreadcrumbPage renders as <span aria-current="page">
    expect(screen.getByText('Summer Art Auction 2025')).toHaveAttribute('aria-current', 'page');
  });

  it('last item is not wrapped in an anchor/link', () => {
    render(<Breadcrumbs items={twoItems} />);

    const lastText = screen.getByText('Summer Art Auction 2025');
    expect(lastText.closest('a')).toBeNull();
  });

  it('items with href render as links with the correct href', () => {
    render(<Breadcrumbs items={twoItems} />);

    const link = screen.getByRole('link', { name: 'Auctions' });
    expect(link).toHaveAttribute('href', '/crm/auctions');
  });

  it('items without href do not render as links', () => {
    render(<Breadcrumbs items={singleItem} />);

    // BreadcrumbPage renders as <span role="link" aria-disabled> — not a navigable anchor
    expect(document.querySelector('a')).toBeNull();
  });

  it('separator is rendered between items but not after the last item', () => {
    render(<Breadcrumbs items={twoItems} />);

    // 2 items → exactly 1 separator
    const separators = screen.getAllByText('/');
    expect(separators).toHaveLength(1);
  });
});
