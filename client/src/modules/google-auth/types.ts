export type GoogleCredentialResponse = {
  credential: string;
};

export type GoogleIdInitializeConfig = {
  client_id: string;
  nonce: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  use_fedcm_for_prompt?: boolean;
};

export type GsiButtonConfig = {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: number;
  locale?: string;
};

export interface GoogleAccountsId {
  initialize(config: GoogleIdInitializeConfig): void;
  prompt(): void;
  renderButton(parent: HTMLElement, options: GsiButtonConfig): void;
  cancel(): void;
}

export type GoogleAuthCallbacks = {
  onReady: () => void;
  onLoading: () => void;
  onSuccess: () => void;
  onFatalError: (cause: unknown) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId;
      };
    };
  }
}
