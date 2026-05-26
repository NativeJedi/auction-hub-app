import type { GoogleAccountsId } from './types';

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

let cachedPromise: Promise<GoogleAccountsId> | null = null;

export const loadGisScript = (): Promise<GoogleAccountsId> => {
  if (cachedPromise) return cachedPromise;

  if (typeof window === 'undefined') {
    return Promise.reject(new Error('GIS can only be loaded in the browser'));
  }

  cachedPromise = new Promise<GoogleAccountsId>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SCRIPT_SRC}"]`);

    const onLoad = () => {
      const gis = window.google?.accounts.id;
      if (!gis) {
        reject(new Error('GIS loaded but window.google.accounts.id is unavailable'));
        return;
      }
      resolve(gis);
    };

    const onError = () => {
      cachedPromise = null;
      reject(new Error('Failed to load Google Identity Services script'));
    };

    if (existing) {
      if (window.google?.accounts.id) {
        resolve(window.google.accounts.id);
        return;
      }
      existing.addEventListener('load', onLoad, { once: true });
      existing.addEventListener('error', onError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', onError, { once: true });
    document.head.appendChild(script);
  });

  return cachedPromise;
};
