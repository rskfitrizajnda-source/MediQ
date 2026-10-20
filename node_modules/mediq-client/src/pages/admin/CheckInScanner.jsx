import React, { useState } from 'react';
import { api } from '../../services/api';
import QRScannerModal from '../../components/QRScannerModal';
import Badge from '../../components/Badge';
import { QrCode, CheckCircle, AlertCircle, Keyboard, Clock, User, ArrowRight } from 'lucide-react';

export default function CheckInScanner() {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const processCheckIn = async (code) => {
    if (!code) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.queues.checkIn(code.trim());
      if (res.success) {
        setResult(res);
      }
    } catch (err) {
      setError(err.message || 'Check-in gagal. Kode tidak valid.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    processCheckIn(manualCode);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm text-center space-y-4">
        <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto shadow-md">
          <QrCode className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Stasiun Scanner Check-in Mandiri</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pindai QR Code dari layar HP pasien atau masukkan kode booking untuk konfirmasi kedatangan.
          </p>
        </div>

        <button
          onClick={() => setScannerOpen(true)}
          className="w-full sm:w-auto px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl text-sm shadow-lg shadow-primary-500/25 transition-all flex items-center justify-center gap-2 mx-auto"
        >
          <QrCode className="w-5 h-5" />
          Buka Kamera Scanner
        </button>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            atau ketik kode tiket
          </span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <form onSubmit={handleManualSubmit} className="flex gap-2 max-w-md mx-auto">
          <input
            type="text"
            placeholder="MED-20261008-0001"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 uppercase font-mono"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            {loading ? '...' : 'Proses'}
          </button>
        </form>
      </div>

      {/* Tampilan Error */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tampilan Sukses / Hasil Check-in */}
      {result && result.data && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Check-in Berhasil Dikonfirmasi!</h2>
              <p className="text-xs text-slate-500">{result.message}</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Nomor Antrean</p>
              <p className="text-4xl font-black font-mono text-primary-600">
                {result.data.ticketNumber}
              </p>
            </div>
            <div className="text-right">
              <Badge status={result.data.status} />
              <p className="text-xs text-slate-500 mt-1 font-semibold">
                {result.data.polyclinic?.name}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
            <div>
              <span className="text-slate-400 block font-semibold">Pasien:</span>
              <span className="font-bold text-slate-800 text-sm">{result.data.patient?.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Dokter:</span>
              <span className="font-bold text-slate-800 text-sm">{result.data.doctor?.user?.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Ruang Praktik:</span>
              <span className="font-bold text-slate-800">{result.data.doctor?.roomNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Kode Booking:</span>
              <span className="font-mono text-slate-800">{result.data.bookingCode}</span>
            </div>
          </div>
        </div>
      )}

      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={processCheckIn}
      />
    </div>
  );
}

