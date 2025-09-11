// components/AuctionManager.tsx
'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/app/services/http-client.service';

interface Auction {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
}

interface CreateAuctionDto {
  name: string;
  description?: string;
}

export default function AuctionManager() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchAuctions = async () => {
    try {
      const res = await apiClient.get<{ items: Auction[] }>('/auctions', {
        params: { limit: 10 },
      });
      setAuctions(res.data.items || []);
    } catch (err) {
      console.error('Failed to fetch auctions', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);
    try {
      const payload: CreateAuctionDto = { name, description };
      await apiClient.post('/auctions', payload);
      setName('');
      setDescription('');
      fetchAuctions(); // оновлюємо список після створення
    } catch (err) {
      console.error('Failed to create auction', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  return (
    <div className="p-6 max-w-xl">
      <h2 className="text-xl font-bold mb-4">Create Auction</h2>
      <form onSubmit={handleCreate} className="space-y-2 mb-6">
        <div>
          <label className="block font-medium mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Auction'}
        </button>
      </form>

      <h2 className="text-xl font-bold mb-2">Auctions</h2>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
        <tr className="bg-gray-100">
          <th className="border p-2">ID</th>
          <th className="border p-2">Name</th>
          <th className="border p-2">Description</th>
          <th className="border p-2">Status</th>
          <th className="border p-2">Created At</th>
        </tr>
        </thead>
        <tbody>
        {auctions.map((a) => (
          <tr key={a.id}>
            <td className="border p-2">{a.id}</td>
            <td className="border p-2">{a.name}</td>
            <td className="border p-2">{a.description || '-'}</td>
            <td className="border p-2">{a.status}</td>
            <td className="border p-2">
              {new Date(a.createdAt).toLocaleString()}
            </td>
          </tr>
        ))}
        {auctions.length === 0 && (
          <tr>
            <td className="border p-2 text-center" colSpan={5}>
              No auctions
            </td>
          </tr>
        )}
        </tbody>
      </table>
    </div>
  );
}
