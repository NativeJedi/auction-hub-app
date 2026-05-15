import { describe, expect, it } from 'vitest';
import { formatISODate } from './date';

describe('formatISODate', () => {
  it('formats a valid ISO string to the uk-UA locale pattern', () => {
    const result = formatISODate('2024-06-15T12:00:00.000Z');

    expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2}:\d{2}/);
    expect(result).toContain('2024');
  });

  it('returns the same value when given a Date object vs its ISO string', () => {
    const date = new Date('2024-06-15T12:00:00.000Z');

    expect(formatISODate(date)).toBe(formatISODate('2024-06-15T12:00:00.000Z'));
  });

  it('throws when the input is not a valid date string', () => {
    expect(() => formatISODate('not-a-date')).toThrow('Invalid date');
  });
});
