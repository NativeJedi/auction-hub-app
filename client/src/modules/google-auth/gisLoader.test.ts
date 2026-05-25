// @vitest-environment jsdom
import { describe, it } from 'vitest';

describe('loadGisScript', () => {
  it.todo('resolves with window.google.accounts.id once the GIS script loads');
  it.todo('injects only one <script> tag when called repeatedly');
  it.todo('rejects when the script load fails');
  it.todo('rejects when called in a non-browser environment (no window)');
});
