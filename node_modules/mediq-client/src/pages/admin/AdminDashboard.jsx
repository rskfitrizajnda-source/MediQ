import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import Badge from '../../components/Badge';
import QRScannerModal from '../../components/QRScannerModal';
import {
  Users,
  UserCheck,
  CheckCircle,
  Clock,
  QrCode,
  UserPlus,
  RefreshCw,
  Search,
  Filter,
  Activity,
  Tv,
  FolderHeart,
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const { socket } = useSocket();

  const [overview, setOverview] = useState(null);
  const [queues, setQueues] = useState([]);
  const [polyclinics, setPolyclinics] = useState([]);
  const [selectedPolyFilter, setSelectedPolyFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Scanner modal state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const [overviewRes, queuesRes, polyRes] = await Promise.all([
        api.clinic.getOverview(),
        api.queues.getToday({
          polyclinicId: selectedPolyFilter || undefined,
          status: selectedStatusFilter || undefined,
          search: searchQuery || undefined,
        }),
        api.clinic.getPolyclinics(),
      ]);

      if (overviewRes.success) setOverview(overviewRes);
      if (queuesRes.success) setQueues(queuesRes.data);
      if (polyRes.success) setPolyclinics(polyRes.data);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPolyFilter, selectedStatusFilter, searchQuery]);

  // Real-time synchronization
  useEffect(() => {
    if (socket) {
      socket.emit('join:admin');

      const handleUpdate = () => {
        fetchDashboardData();
      };

      socket.on('queue:updated', handleUpdate);
      socket.on('queue:status_changed', handleUpdate);

      return () => {
        socket.off('queue:updated', handleUpdate);
        socket.off('queue:status_changed', handleUpdate);
      };
    }
  }, [socket]);

  const handleScanSuccess = async (decodedCode) => {
    try {
      const res = await api.queues.checkIn(decodedCode);
      if (res.success) {
        setScanMessage({
          type: res.alreadyCheckedIn ? 'warning' : 'success',
          text: res.message,
        });
        fetchDashboardData();
      }
    } catch (err) {
      setScanMessage({
        type: 'error',
        text: err.message || 'Gagal memproses check-in tiket.',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Memuat Dasbor Monitoring MediQ...</p>
      </div>
    );
  }

  const stats = overview?.stats || {};
  const polyStats = overview?.polyclinicStats || [];

  return (
    <div className="space-y-6">
      {/* Notifikasi Hasil Scan */}
      {scanMessage && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-center justify-between shadow-sm animate-fadeIn ${
            scanMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : scanMessage.type === 'warning'
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{scanMessage.text}</span>
          <button
            onClick={() => setScanMessage(null)}
            className="text-xs font-bold underline ml-4"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Dasbor Monitoring Klinik</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantauan antrean real-time seluruh poliklinik dan kontrol resepsionis
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setScannerOpen(true)}
            className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/20 transition-all flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            Scan QR Check-in
          </button>

          <Link
            to="/admin/walk-in"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Pasien Walk-in
          </Link>

          <Link
            to="/admin/patients"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
          >
            <FolderHeart className="w-4 h-4" />
            Riwayat Pasien
          </Link>

          <a
            href="/display"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          >
            <Tv className="w-4 h-4" />
            Smart TV
          </a>
        </div>
      </div>

      {/* Statistik Keseluruhan Klinik Hari Ini */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Total Pasien</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{stats.totalPatientsToday || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-amber-500 uppercase">Menunggu Check-in</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{stats.pendingCount || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-blue-500 uppercase">Check-in (Antre)</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{stats.checkedInCount || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-indigo-500 uppercase">Sedang Konsultasi</p>
          <p className="text-2xl font-black text-indigo-600 mt-1">{stats.inProgressCount || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-xs font-bold text-emerald-500 uppercase">Selesai</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats.completedCount || 0}</p>
        </div>
      </div>

      {/* Grid Status Per Poliklinik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {polyStats.map((p) => (
          <div
            key={p.id}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden"
          >
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{ backgroundColor: p.color || '#2563eb' }}
            />
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Kode {p.code}
                </span>
                <h3 className="font-extrabold text-slate-800 text-base">{p.name}</h3>
              </div>
              <span className="text-lg font-black font-mono text-slate-800">{p.total} Pasien</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Antre</span>
                <span className="font-bold text-blue-600">{p.waiting}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Aktif</span>
                <span className="font-bold text-indigo-600">{p.inProgress}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Selesai</span>
                <span className="font-bold text-emerald-600">{p.completed}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter & Tabel Data Antrean */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Daftar Antrean Pasien Hari Ini</h2>
              <p className="text-xs text-slate-500">Pencarian dan pemantauan status check-in pasien</p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <input
                  type="text"
                  placeholder="Cari nama / tiket..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <select
                value={selectedPolyFilter}
                onChange={(e) => setSelectedPolyFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">Semua Poliklinik</option>
                {polyclinics.map((poly) => (
                  <option key={poly.id} value={poly.id}>
                    {poly.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">Semua Status</option>
                <option value="PENDING">PENDING</option>
                <option value="CHECKED_IN">CHECKED_IN</option>
                <option value="CALLING">CALLING</option>
                <option value="IN_CONSULTATION">IN_CONSULTATION</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="SKIPPED">SKIPPED</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">No. Tiket</th>
                <th className="px-6 py-3.5">Kode Booking</th>
                <th className="px-6 py-3.5">Pasien</th>
                <th className="px-6 py-3.5">Poli & Dokter</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Check-in</th>
                <th className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {queues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
                    Tidak ada antrean yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                queues.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-black text-slate-900">
                      {q.ticketNumber}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {q.bookingCode}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{q.patient?.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{q.patient?.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-700">{q.polyclinic?.name}</div>
                      <div className="text-xs text-slate-400">{q.doctor?.user?.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={q.status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {q.checkInTime ? format(new Date(q.checkInTime), 'HH:mm') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {q.status === 'PENDING' ? (
                        <button
                          onClick={() => handleScanSuccess(q.bookingCode)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          Check-in
                        </button>
                      ) : (
                        <Link
                          to={`/patient/ticket/${q.bookingCode}`}
                          target="_blank"
                          className="text-xs text-primary-600 hover:underline font-semibold"
                        >
                          Lihat Tiket
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Scanner QR Camera */}
      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
}

