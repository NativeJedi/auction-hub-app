'use client';

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface EventLog {
  id: number;
  message: string;
}

let adminSocket: Socket | null = null;
let memberSocket: Socket | null = null;

const SOCKET_URL = "http://localhost:3000/ws/room";

// ==================== Admin Component ====================
export function AdminSocket() {
  const [token, setToken] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<EventLog[]>([]);

  const handleConnect = () => {
    if (!token) return alert('Please enter token');

    if (adminSocket) adminSocket.disconnect();

    adminSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    adminSocket.on('connect', () => {
      setIsConnected(true);
      adminSocket?.emit('join')
    });

    adminSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    adminSocket.onAny((event, data) => {
      logEvent(`[${event}] ${JSON.stringify(data)}`);
    });
  };

  const logEvent = (message: string) => {
    setEvents((prev) => [...prev, { id: Date.now(), message }]);
  };

  const handlePlaceLot = () => {
    if (!adminSocket) return alert('Socket not connected');

    adminSocket.emit('placeLot');
  };

  return (
    <div className="flex flex-col gap-4 max-w-md p-6 rounded-xl shadow bg-gray-50">
      <h2 className="text-xl font-bold">Admin</h2>

      <input
        type="text"
        placeholder="Enter admin token"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        className="border rounded p-2"
      />
      <button
        onClick={handleConnect}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Connect
      </button>

      <div>
        Status:{' '}
        <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <button
        onClick={handlePlaceLot}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Place Lot
      </button>

      <div className="mt-4 max-h-64 overflow-y-auto border rounded p-2 bg-white">
        {events.map((e) => (
          <div key={e.id} className="text-sm border-b py-1">
            {e.message}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== Member Component ====================
export function MemberSocket() {
  const [token, setToken] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [bid, setBid] = useState(0);
  const [events, setEvents] = useState<EventLog[]>([]);

  const handleConnect = () => {
    if (!token) return alert('Please enter token');

    if (memberSocket) memberSocket.disconnect();

    memberSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    memberSocket.on('connect', () => {
      setIsConnected(true);
    });

    memberSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    memberSocket.onAny((event, data) => {
      logEvent(`[${event}] ${JSON.stringify(data)}`);
    });
  };

  const logEvent = (message: string) => {
    setEvents((prev) => [...prev, { id: Date.now(), message }]);
  };

  const handlePlaceBid = () => {
    if (!memberSocket) return alert('Socket not connected');
    memberSocket.emit('placeBid', bid);
    setBid(0);
  };

  useEffect(() => {
    return () => {
      memberSocket?.disconnect();
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 max-w-md p-6 rounded-xl shadow bg-gray-50">
      <h2 className="text-xl font-bold">Member</h2>

      <input
        type="text"
        placeholder="Enter member token"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        className="border rounded p-2"
      />
      <button
        onClick={handleConnect}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Connect
      </button>

      <div>
        Status:{' '}
        <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <input
        type="number"
        placeholder="Bid amount"
        value={bid}
        onChange={(e) => setBid(Number(e.target.value))}
        className="border rounded p-2"
      />
      <button
        onClick={handlePlaceBid}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Place Bid
      </button>

      <div className="mt-4 max-h-64 overflow-y-auto border rounded p-2 bg-white">
        {events.map((e) => (
          <div key={e.id} className="text-sm border-b py-1">
            {e.message}
          </div>
        ))}
      </div>
    </div>
  );
}
