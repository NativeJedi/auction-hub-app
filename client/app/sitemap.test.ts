// @vitest-environment node
import { describe, expect, it } from 'vitest';
import sitemap from './sitemap';

describe('sitemap', () => {
  it('returns an entry for the landing root "/"', () => {
    const entries = sitemap();

    expect(entries).toHaveLength(1);
    expect(entries[0].url).toMatch(/\/$/);
    expect(entries[0].priority).toBe(1);
  });

  it('marks the landing entry with a lastModified date', () => {
    const entries = sitemap();

    expect(entries[0].lastModified).toBeInstanceOf(Date);
  });
});
