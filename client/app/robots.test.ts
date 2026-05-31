// @vitest-environment node
import { describe, expect, it } from 'vitest';
import robots from './robots';

describe('robots', () => {
  it('allows the "*" user agent to crawl "/"', () => {
    const result = robots();

    expect(result.rules).toEqual(expect.objectContaining({ userAgent: '*', allow: '/' }));
  });

  it('references the sitemap URL', () => {
    const result = robots();

    expect(result.sitemap).toMatch(/\/sitemap\.xml$/);
  });

  it('keeps private and functional routes out of the index', () => {
    const result = robots();

    expect(result.rules).toEqual(
      expect.objectContaining({ disallow: ['/crm', '/room', '/results', '/confirm-email'] })
    );
  });
});
