export {};

declare global {
  interface Window {
    refreshingPromise?: Promise<unknown>;
  }
}
