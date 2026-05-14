import type BaseSocket from '@/src/sockets/base-socket';
import { getRoomToken } from '@/src/utils/local-storage';
import { Lifecycle } from './types';

export abstract class RoomEngine<TData> {
  // Lifecycle fields — owned and mutated exclusively by the base class
  private lifecycle: Lifecycle = { isLoading: false, error: null };

  // Domain data — owned and mutated exclusively by subclasses
  protected data: TData;

  private listeners = new Set<(s: TData & Lifecycle) => void>();
  private cachedState: (TData & Lifecycle) | null = null;

  protected constructor(
    protected readonly roomId: string,
    protected readonly socket: BaseSocket,
  ) {
    this.data = this.getInitialData();
  }

  private onError?: (error: Error) => void;

  setOnError(cb: (error: Error) => void): void {
    this.onError = cb;
  }

  protected abstract getInitialData(): TData;
  protected abstract fetchInitialData(): Promise<Partial<TData>>;

  // Base class mutates its own fields — concrete type, no generics needed
  private setLifecycle(patch: Partial<Lifecycle>): void {
    this.lifecycle = { ...this.lifecycle, ...patch };
    this.cachedState = null;
    this.notify();
  }

  // Subclasses mutate their own domain data — TData is entirely theirs
  protected setState(patch: Partial<TData>): void {
    this.data = { ...this.data, ...patch };
    this.cachedState = null;
    this.notify();
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((fn) => fn(state));
  }

  // Merges domain data with lifecycle — stable reference between mutations
  getState(): TData & Lifecycle {
    if (this.cachedState === null) {
      this.cachedState = { ...this.data, ...this.lifecycle };
    }
    return this.cachedState;
  }

  // React bridge: pass useState's setState directly
  // Immediately emits current state so the hook is in sync before first fetch
  subscribe(listener: (s: TData & Lifecycle) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  async connect(): Promise<void> {
    this.setLifecycle({ isLoading: true, error: null });
    try {
      const data = await this.fetchInitialData();
      this.setState(data);
      const token = getRoomToken(this.roomId);

      await this.socket.connect(token ?? '');

      this.registerSocketEvents();

      this.setLifecycle({ isLoading: false });
    } catch (e) {
      const error = `Failed to connect to room: ${(e as Error).message}`;

      console.error(error);
      this.setLifecycle({ isLoading: false, error });
    }
  }

  destroy(): void {
    this.socket.disconnect();
    this.listeners.clear();
  }

  // Common socket events shared across all roles
  // Call super.registerSocketEvents() in subclasses before adding role-specific ones
  protected registerSocketEvents(): void {
    this.socket.onError((e) => {
      this.onError?.(e);
    });
  }
}
