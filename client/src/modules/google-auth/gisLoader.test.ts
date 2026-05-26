// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

const fakeGis = { initialize: vi.fn(), prompt: vi.fn() };

const setupWindowGoogle = () => {
  (window as unknown as { google: unknown }).google = {
    accounts: { id: fakeGis },
  };
};

const clearWindowGoogle = () => {
  delete (window as unknown as { google?: unknown }).google;
};

const fireLoadOnLastScript = () => {
  const scripts = document.querySelectorAll<HTMLScriptElement>(
    `script[src="${GIS_SCRIPT_SRC}"]`,
  );
  const last = scripts[scripts.length - 1];
  if (!last) throw new Error('expected a GIS <script> tag in the document');
  last.dispatchEvent(new Event('load'));
};

const fireErrorOnLastScript = () => {
  const scripts = document.querySelectorAll<HTMLScriptElement>(
    `script[src="${GIS_SCRIPT_SRC}"]`,
  );
  const last = scripts[scripts.length - 1];
  if (!last) throw new Error('expected a GIS <script> tag in the document');
  last.dispatchEvent(new Event('error'));
};

describe('loadGisScript', () => {
  beforeEach(() => {
    vi.resetModules();
    document.head.innerHTML = '';
    clearWindowGoogle();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('resolves with window.google.accounts.id once the GIS script loads', async () => {
    const { loadGisScript } = await import('./gisLoader');

    const promise = loadGisScript();
    setupWindowGoogle();
    fireLoadOnLastScript();

    await expect(promise).resolves.toBe(fakeGis);
  });

  it('injects only one <script> tag when called repeatedly (idempotent)', async () => {
    const { loadGisScript } = await import('./gisLoader');

    const p1 = loadGisScript();
    const p2 = loadGisScript();
    setupWindowGoogle();
    fireLoadOnLastScript();

    await Promise.all([p1, p2]);

    const scripts = document.querySelectorAll(`script[src="${GIS_SCRIPT_SRC}"]`);
    expect(scripts).toHaveLength(1);
  });

  it('rejects when the script load fails', async () => {
    const { loadGisScript } = await import('./gisLoader');

    const promise = loadGisScript();
    fireErrorOnLastScript();

    await expect(promise).rejects.toThrow('Failed to load Google Identity Services script');
  });

  it('rejects in a non-browser environment (no window)', async () => {
    vi.resetModules();
    const originalWindow = globalThis.window;
    // Simulate SSR by removing window from the global scope before module evaluation.
    // @ts-expect-error — intentional teardown of globalThis.window
    delete globalThis.window;

    try {
      const { loadGisScript } = await import('./gisLoader');
      await expect(loadGisScript()).rejects.toThrow(
        'GIS can only be loaded in the browser',
      );
    } finally {
      globalThis.window = originalWindow;
    }
  });
});
