import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.user.role === 'DOCTOR') {
        navigate('/doctor/dashboard');
      } else if (res.user.role === 'PATIENT') {
        navigate('/patient/booking');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Email atau password salah.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail) => {
    setEmail(quickEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-primary-500/30">
            <Activity className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-800">Masuk Portal MediQ</h1>
          <p className="text-xs text-slate-500">
            Masuk untuk mengakses layanan dokter, resepsionis, atau portal pasien
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Pengguna
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@gmail.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-primary-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Masuk ke Sistem'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Tombol Demo Cepat */}
        <div className="pt-4 border-t border-slate-100">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-2.5">
            Akun Percobaan (Demo Quick Access)
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin('dokter.andi@gmail.com')}
              className="p-2 border border-slate-200 hover:border-primary-400 hover:bg-primary-50 rounded-lg text-slate-700 transition-colors text-left"
            >
              <div className="font-bold text-[11px] truncate">dr. Andi</div>
              <div className="text-[10px] text-slate-400 truncate">Poli Umum</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('resepsionis@gmail.com')}
              className="p-2 border border-slate-200 hover:border-primary-400 hover:bg-primary-50 rounded-lg text-slate-700 transition-colors text-left"
            >
              <div className="font-bold text-[11px] truncate">Resepsionis</div>
              <div className="text-[10px] text-slate-400 truncate">Siti</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('pasien@gmail.com')}
              className="p-2 border border-slate-200 hover:border-primary-400 hover:bg-primary-50 rounded-lg text-slate-700 transition-colors text-left"
            >
              <div className="font-bold text-[11px] truncate">Pasien Rian</div>
              <div className="text-[10px] text-slate-400 truncate">Demo Pasien</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

