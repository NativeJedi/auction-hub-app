export type GoogleCredentialResponse = {
  credential: string;
};

export type GoogleIdInitializeConfig = {
  client_id: string;
  nonce: string;
  callback: (response: GoogleCredentialResponse) => void;
};

export interface GoogleAccountsId {
  initialize(config: GoogleIdInitializeConfig): void;
  prompt(): void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId;
      };
    };
  }
}
