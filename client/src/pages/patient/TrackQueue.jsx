import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Ticket, ArrowRight, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

export default function TrackQueue() {
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const res = await api.queues.track(code.trim());
      if (res.success && res.data) {
        navigate(`/patient/ticket/${res.data.bookingCode}`);
      } else {
        setError('Antrean dengan kode tersebut tidak ditemukan.');
      }
    } catch (err) {
      setError(err.message || 'Antrean tidak ditemukan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center mx-auto">
            <Ticket className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-800">Lacak Antrean Pasien</h1>
          <p className="text-xs text-slate-500">
            Masukkan Nomor Tiket (cth: A-002) atau Kode Booking (cth: MED-20261008-0002)
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Kode Antrean
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="A-002 atau MED-..."
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 uppercase font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-primary-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Mencari...' : 'Lacak Status Antrean'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}

