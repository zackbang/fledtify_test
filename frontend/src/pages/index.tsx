import { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:8080/api/login', { username, password });
      Cookies.set('token', res.data.token);
      router.push('/invoice');
    } catch (err) {
      console.error(err);
      alert("Login Gagal! Pastikan Username & Password benar.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-200">
        <h1 className="text-4xl font-black text-black mb-1 tracking-tighter italic">FLEETIFY</h1>
        <p className="text-gray-600 mb-8 font-bold uppercase text-xs tracking-widest">Logistics System</p>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-black text-black mb-2 uppercase italic">Username</label>
            <input
              type="text"
              className="w-full p-3 border-2 border-gray-400 rounded-lg text-black font-bold focus:border-blue-600 outline-none"
              placeholder="Admin / Kerani"
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-black text-black mb-2 uppercase italic">Password</label>
            <input
              type="password"
              className="w-full p-3 border-2 border-gray-400 rounded-lg text-black font-bold focus:border-blue-600 outline-none"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-800 text-white font-black py-4 rounded-lg shadow-lg uppercase tracking-tighter text-lg">
            Masuk ke Sistem
          </button>
        </form>
      </div>
    </div>
  );
}