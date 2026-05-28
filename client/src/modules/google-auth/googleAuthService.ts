import { getGoogleNonce, googleAuth } from '@/src/api/auctions-api-client/requests/auth';
import { loadGisScript } from './gisLoader';
import type {
  GoogleAccountsId,
  GoogleAuthCallbacks,
  GoogleCredentialResponse,
  GsiButtonConfig,
} from './types';

const NONCE_NOT_FOUND_REASON = 'NONCE_NOT_FOUND';

const extractReason = (err: unknown): string | undefined => {
  if (typeof err !== 'object' || err === null) return undefined;
  const data = (err as { data?: unknown }).data;
  if (typeof data !== 'object' || data === null) return undefined;
  const reason = (data as { reason?: unknown }).reason;
  return typeof reason === 'string' ? reason : undefined;
};

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

const BUTTON_OPTIONS: GsiButtonConfig = {
  type: 'standard',
  theme: 'outline',
  size: 'large',
  text: 'continue_with',
  shape: 'rectangular',
  logo_alignment: 'left',
};

export class GoogleAuthService {
  private gis: GoogleAccountsId | null = null;
  private readonly container: HTMLElement;
  private readonly callbacks: GoogleAuthCallbacks;
  private retried = false;
  private disposed = false;

  constructor(container: HTMLElement, callbacks: GoogleAuthCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
  }

  stopInit(): void {
    this.disposed = true;
    this.gis?.cancel();
  }

  async init(): Promise<void> {
    if (!CLIENT_ID) {
      this.notify('onFatalError', 'client_id is not set');
      return;
    }

    const gis = await loadGisScript();
    if (this.disposed) return;
    this.gis = gis;

    const { nonce } = await getGoogleNonce();
    if (this.disposed) return;

    gis.initialize({
      client_id: CLIENT_ID,
      nonce,
      callback: this.handleCredential(nonce),
      auto_select: false,
      use_fedcm_for_prompt: true,
    });
    gis.renderButton(this.container, {
      ...BUTTON_OPTIONS,
      width: Math.max(this.container.clientWidth, 300),
    });
    gis.prompt();

    this.notify('onReady');
  }

  private notify<K extends keyof GoogleAuthCallbacks>(
    name: K,
    ...args: Parameters<GoogleAuthCallbacks[K]>
  ): void {
    if (this.disposed) return;
    const fn = this.callbacks[name] as (...a: Parameters<GoogleAuthCallbacks[K]>) => unknown;
    fn(...args);
  }

  private handleCredential =
    (nonce: string) =>
    async (response: GoogleCredentialResponse): Promise<void> => {
      this.notify('onLoading');
      try {
        await googleAuth({ credential: response.credential, nonce });
        this.notify('onSuccess');
        this.retried = false;
      } catch (err) {
        const reason = extractReason(err);
        if (reason === NONCE_NOT_FOUND_REASON && !this.retried && !this.disposed) {
          this.retried = true;
          try {
            await this.init();
          } catch (reinitErr) {
            this.notify('onFatalError', reinitErr);
          }
          return;
        }
        this.notify('onFatalError', err);
      }
    };
}
