"use client";

import { useState } from "react";
import { apiClient } from '../services/http-client.service';

type AuthForm = {
  email: string;
  password: string;
};

export default function AuthComponent() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState<AuthForm>({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const res = await apiClient.post(endpoint, form);

      const { accessToken, refreshToken } = res.data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      alert(`Success! Logged in as ${form.email}`);
      setForm({ email: "", password: "" });
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md m-6 p-6 border rounded shadow">
      <div className="flex justify-center gap-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${isLogin ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setIsLogin(true)}
        >
          Login
        </button>
        <button
          className={`px-4 py-2 rounded ${!isLogin ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setIsLogin(false)}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="border p-2 rounded"
          required
          minLength={5}
        />

        {error && <div className="text-red-600">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {loading ? "Processing..." : isLogin ? "Login" : "Register"}
        </button>
      </form>
    </div>
  );
}
