// @vitest-environment jsdom
import { describe, it, vi } from 'vitest';
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

const _singleItem: BreadcrumbEntry[] = [{ label: 'Home' }];
const _twoItems: BreadcrumbEntry[] = [
  { label: 'Auctions', href: '/crm/auctions' },
  { label: 'Summer Art Auction 2025' },
];

describe('Breadcrumbs', () => {
  it.todo('renders a <nav aria-label="breadcrumb"> element');
  it.todo('renders the correct number of <li> elements');
  it.todo('renders an empty list without throwing when items is an empty array');
  it.todo('last item has aria-current="page" attribute');
  it.todo('last item is not wrapped in an anchor/link');
  it.todo('items with href render as links with the correct href');
  it.todo('items without href do not render as links');
  it.todo('separator is rendered between items but not after the last item');
});
