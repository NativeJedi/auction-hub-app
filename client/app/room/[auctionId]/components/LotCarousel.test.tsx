// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/ui-kit/ui/carousel', () => ({
  Carousel: ({ children }: any) => <div>{children}</div>,
  CarouselContent: ({ children }: any) => <div>{children}</div>,
  CarouselItem: ({ children }: any) => <div>{children}</div>,
  CarouselNext: () => <button>Next</button>,
  CarouselPrevious: () => <button>Previous</button>,
}));

import LotCarousel from './LotCarousel';

const makeImage = (id: string) => ({ id, url: `https://example.com/${id}.jpg` });

describe('LotCarousel', () => {
  it('renders all images as carousel items', () => {
    render(<LotCarousel images={[makeImage('a'), makeImage('b')]} name="Watch" />);

    const imgs = screen.getAllByRole('img');
    expect(imgs).toHaveLength(2);
    expect(imgs[0]).toHaveAttribute('src', 'https://example.com/a.jpg');
    expect(imgs[1]).toHaveAttribute('src', 'https://example.com/b.jpg');
  });

  it('shows prev/next navigation buttons when there are multiple images', () => {
    render(<LotCarousel images={[makeImage('a'), makeImage('b')]} name="Watch" />);

    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('hides navigation buttons for a single image', () => {
    render(<LotCarousel images={[makeImage('a')]} name="Watch" />);

    expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
  });
});
