import { io, Socket } from 'socket.io-client';

class BaseSocket {
  private socket: Socket | null = null;

  constructor(private readonly SOCKET_URL: string) {}

  connect(token: string): Promise<void> {
    if (this.socket) return Promise.resolve();

    return new Promise((resolve, reject) => {
      this.socket = io(this.SOCKET_URL, {
        transports: ['websocket', 'polling'],
        auth: { token },
      });

      this.socket.once('connect', () => {
        console.log('Socket connected');
        resolve();
      });

      this.socket.once('connect_error', (error) => {
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
    });
  }

  disconnect() {
    const socket = this.socket;
    this.socket = null;
    socket?.disconnect?.();
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  onReconnect(callback: () => void): void {
    if (!this.socket) throw new Error('Socket is not connected');
    this.socket.io.on('reconnect', callback);
  }

  onEvent<T = void>(event: string, callback: (data: T) => void) {
    if (!this.socket) {
      throw new Error('Socket is not connected');
    }

    this.socket.on(event, callback);
  }

  onError(callback: (error: Error) => void) {
    this.onEvent('connect_error', callback);
    this.onEvent('error', callback);
  }

  emitEvent<T = void>(event: string, data?: T) {
    if (!this.socket) {
      throw new Error('Socket is not connected');
    }

    this.socket.emit(event, data);
  }

  offEvent(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) {
      throw new Error('Socket is not connected');
    }
    this.socket.off(event, callback);
  }
}

export default BaseSocket;
