// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import LanguageSwitcher from './LanguageSwitcher';

describe('LanguageSwitcher', () => {
  it('trigger button renders with text "EN"', () => {
    render(<LanguageSwitcher />);

    expect(screen.getByRole('button', { name: /en/i })).toBeInTheDocument();
  });

  it('opening the dropdown shows three locale items', async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    await user.click(screen.getByRole('button', { name: /en/i }));

    expect(await screen.findAllByRole('menuitem')).toHaveLength(3);
  });

  it('EN item contains a checkmark element', async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    await user.click(screen.getByRole('button', { name: /en/i }));

    const enItem = await screen.findByRole('menuitem', { name: /^en$/i });
    expect(enItem.querySelector('svg')).toBeInTheDocument();
  });

  it('FR and DE items have aria-disabled="true"', async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    await user.click(screen.getByRole('button', { name: /en/i }));

    expect(await screen.findByRole('menuitem', { name: /fr/i })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('menuitem', { name: /de/i })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it(
    '"Coming soon" tooltip text is accessible on FR and DE items',
    async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      await user.click(screen.getByRole('button', { name: /en/i }));

      // hover triggers the Tooltip; Radix default delayDuration is 700ms
      await user.hover(await screen.findByRole('menuitem', { name: /fr/i }));

      // Radix renders <span role="tooltip"> as the accessible description
      const tooltip = await screen.findByRole('tooltip', {}, { timeout: 2000 });
      expect(tooltip).toHaveTextContent('Coming soon');
    },
    10000,
  );
});
