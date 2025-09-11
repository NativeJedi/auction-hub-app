'use client';

import { useState } from 'react';
import { apiClient } from '@/app/services/http-client.service';

interface Lot {
  id: string;
  name: string;
  description?: string;
  startPrice: number;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateLotForm {
  auctionId: string;
  name: string;
  description?: string;
  startPrice: number;
  currency: string;
}

export default function LotsComponent() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [form, setForm] = useState<CreateLotForm>({
    auctionId: '',
    name: '',
    description: '',
    startPrice: 0,
    currency: 'USD',
  });
  const [loading, setLoading] = useState(false);

  const fetchLots = async (auctionId: string) => {
    if (!auctionId) return;
    try {
      const { data } = await apiClient.get<Lot[]>(`/auctions/${auctionId}/lots`);
      setLots(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'startPrice' ? Number(value) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.auctionId) return alert('Please enter auction ID');
    setLoading(true);
    try {
      await apiClient.post(`/auctions/${form.auctionId}/lots`, { lots: [form] });
      setForm((prev) => ({ ...prev, name: '', description: '', startPrice: 0 }));
      fetchLots(form.auctionId);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl p-6">
      <h2 className="text-2xl font-bold mb-4">Create Lot</h2>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow space-y-4 border border-gray-200"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="mb-1 font-medium">Auction ID</label>
            <input
              name="auctionId"
              value={form.auctionId}
              onChange={handleChange}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 font-medium">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 font-medium">Description</label>
            <input
              name="description"
              value={form.description}
              onChange={handleChange}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 font-medium">Start Price</label>
            <input
              type="number"
              name="startPrice"
              value={form.startPrice}
              onChange={handleChange}
              min={0}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 font-medium">Currency</label>
            <select
              name="currency"
              value={form.currency}
              onChange={handleChange}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="UAH">UAH</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Lot'}
        </button>
      </form>

      <h2 className="text-2xl font-bold mt-8 mb-4">Lots List</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border-b">Name</th>
            <th className="px-4 py-2 border-b">Description</th>
            <th className="px-4 py-2 border-b">Start Price</th>
            <th className="px-4 py-2 border-b">Currency</th>
            <th className="px-4 py-2 border-b">Status</th>
            <th className="px-4 py-2 border-b">Created At</th>
            <th className="px-4 py-2 border-b">Updated At</th>
          </tr>
          </thead>
          <tbody>
          {lots.map((lot) => (
            <tr key={lot.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 border-b">{lot.name}</td>
              <td className="px-4 py-2 border-b">{lot.description}</td>
              <td className="px-4 py-2 border-b">{lot.startPrice}</td>
              <td className="px-4 py-2 border-b">{lot.currency}</td>
              <td className="px-4 py-2 border-b">{lot.status}</td>
              <td className="px-4 py-2 border-b">{new Date(lot.createdAt).toLocaleString()}</td>
              <td className="px-4 py-2 border-b">{new Date(lot.updatedAt).toLocaleString()}</td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
