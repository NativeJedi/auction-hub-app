import { io, Socket } from 'socket.io-client';

class BaseSocket {
  private socket: Socket | null = null;

  constructor(private readonly SOCKET_URL: string) {}

  connect(token: string): Promise<void> {
    console.log('Connecting to', this.SOCKET_URL);
    return new Promise((resolve, reject) => {
      this.socket = io(this.SOCKET_URL, {
        transports: ['websocket'],
        auth: { token },
      });

      this.socket.once('connect', () => {
        console.log('Socket connected');
        this.emitEvent('join');
        resolve();
      });

      this.socket.once('connect_error', (error) => {
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
        this.socket = null;
      });
    });
  }

  disconnect() {
    this.socket?.disconnect?.();
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
