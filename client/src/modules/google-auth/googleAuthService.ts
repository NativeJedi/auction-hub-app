import { ApiError } from '@/src/api/errors';
import { makeSARequest } from '@/src/api/makeSARequest';
import { googleAuthAction } from '@/src/api/actions/auth.actions';
import { clientFetch } from '@/src/api/clientFetch';
import { loadGisScript } from './gisLoader';
import { authStep, reportAuthFailure } from './telemetry';
import type {
  GoogleAccountsId,
  GoogleAuthCallbacks,
  GoogleCredentialResponse,
  GsiButtonConfig,
} from './types';

const NONCE_NOT_FOUND_REASON = 'NONCE_NOT_FOUND';

const extractReason = (err: unknown): string | undefined =>
  err instanceof ApiError ? err.reason : undefined;

const getNonce = () => clientFetch<{ nonce: string }>('/auth/google/nonce');
const signInWithGoogle = makeSARequest(googleAuthAction);

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

  reprompt(): void {
    if (this.disposed || !this.gis) return;
    this.gis.prompt();
  }

  async init(): Promise<void> {
    if (!CLIENT_ID) {
      reportAuthFailure('config', 'client_id is not set');
      this.notify('onFatalError', 'client_id is not set');
      return;
    }

    // Each step leaves a breadcrumb; if the flow dies silently (blocked
    // webview, script not loading), the last breadcrumb tells us where.
    authStep('init started');

    let stage = 'gis-script';
    try {
      const gis = await loadGisScript();
      if (this.disposed) return;
      this.gis = gis;
      authStep('gis script loaded');

      stage = 'nonce';
      const { nonce } = await getNonce();
      if (this.disposed) return;
      authStep('nonce fetched');

      stage = 'render';
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
      authStep('button rendered, prompt requested');

      this.notify('onReady');
    } catch (err) {
      // Previously init() rejections escaped unhandled (`void service.init()`
      // in the hook) — the user saw nothing and neither did we.
      reportAuthFailure(stage, err);
      this.notify('onFatalError', err);
    }
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
      authStep('credential received');
      this.notify('onLoading');
      try {
        await signInWithGoogle({ credential: response.credential, nonce });
        authStep('sign-in success');
        this.notify('onSuccess');
        this.retried = false;
      } catch (err) {
        const reason = extractReason(err);
        if (reason === NONCE_NOT_FOUND_REASON && !this.retried && !this.disposed) {
          this.retried = true;
          authStep('nonce expired, retrying init');
          // init() reports its own failures now and no longer throws
          await this.init();
          return;
        }
        reportAuthFailure('token-exchange', err);
        this.notify('onFatalError', err);
      }
    };
}
