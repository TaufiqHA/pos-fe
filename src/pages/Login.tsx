import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosStore } from '../store';
import api from '../lib/axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = usePosStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });

      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      login(user);

      if (user.role === 'Kurir') {
        navigate('/pengiriman');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Login gagal. Periksa email dan password Anda.';
      setError(errMsg);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b19] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto h-16 w-16 bg-[#b4f56b] rounded-3xl flex items-center justify-center shadow-lg shadow-[#b4f56b]/20">
          <span className="text-black font-black text-2xl tracking-wider">POS</span>
        </div>
        <p className="mt-2 text-xs font-bold text-[#b4f56b] tracking-widest uppercase">
          RETAIL SYSTEM
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#0b1330] py-8 px-4 shadow-2xl rounded-3xl border border-[#1d2a57] sm:px-10">

          <div className="bg-[#121c45] border border-[#21306b]/60 p-4 rounded-2xl mb-6 text-sm">
            <p className="text-xs font-black text-[#b4f56b] tracking-wider uppercase mb-2">AKUN DEMO (ROLE):</p>
            <ul className="text-xs text-slate-300 space-y-1.5 font-mono">
              <li className="flex justify-between">
                <span>admin@pos.com</span>
                <span className="text-[#b4f56b] font-bold uppercase">[Admin]</span>
              </li>
            </ul>
            <p className="text-[10px] text-slate-400 mt-2 italic">12345678.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-extrabold tracking-wider text-slate-300 uppercase">
                Email Pengguna
              </label>
              <div className="mt-1.5">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 bg-[#0d173d] border border-[#1d2a57] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#b4f56b] focus:border-[#b4f56b] sm:text-sm font-semibold"
                  placeholder="admin@pos.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-extrabold tracking-wider text-slate-300 uppercase">
                Kata Sandi (Password)
              </label>
              <div className="mt-1.5">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 bg-[#0d173d] border border-[#1d2a57] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#b4f56b] focus:border-[#b4f56b] sm:text-sm font-mono"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="text-xs bg-red-950/40 border border-red-500/50 p-3 rounded-xl text-red-400 font-bold leading-relaxed">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3.5 px-4 bg-[#b4f56b] hover:bg-[#a3e451] text-black font-black tracking-widest text-xs uppercase rounded-xl shadow-lg transition-transform focus:scale-95 duration-150 cursor-pointer"
              >
                MASUK KE SISTEM
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
