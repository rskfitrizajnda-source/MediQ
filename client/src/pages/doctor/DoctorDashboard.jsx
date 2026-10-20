import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import {
  Volume2,
  Play,
  RotateCcw,
  CheckCircle2,
  SkipForward,
  User,
  Clock,
  FileText,
  AlertCircle,
  Activity,
  Phone,
  RefreshCw,
  FolderHeart,
} from 'lucide-react';
import { format } from 'date-fns';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal diagnosis / selesai pemeriksaan
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [selectedQueueToFinish, setSelectedQueueToFinish] = useState(null);
  const [diagnosisNotes, setDiagnosisNotes] = useState('');

  // Modal Riwayat Rekam Medis Pasien
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyPatient, setHistoryPatient] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const openPatientHistory = async (patientId) => {
    if (!patientId) return;
    setLoadingHistory(true);
    setHistoryModalOpen(true);
    try {
      const res = await api.patients.getHistoryById(patientId);
      if (res.success && res.data) {
        setHistoryPatient(res.data);
      }
    } catch (err) {
      alert(err.message || 'Gagal mengambil riwayat medis pasien.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchDoctorData = async () => {
    try {
      const res = await api.doctors.getQueues();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      setError(err.message || 'Gagal mengambil antrean dokter.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, []);

  // Listen socket events
  useEffect(() => {
    if (socket && data?.doctor?.id) {
      socket.emit('join:doctor', data.doctor.id);

      const handleUpdate = () => {
        fetchDoctorData();
      };

      socket.on('queue:updated', handleUpdate);
      socket.on('queue:status_changed', handleUpdate);

      return () => {
        socket.off('queue:updated', handleUpdate);
        socket.off('queue:status_changed', handleUpdate);
      };
    }
  }, [socket, data?.doctor?.id]);

  // Aksi Kontrol Antrean Dokter
  const handleCall = async (queueId) => {
    try {
      setActionLoading(true);
      await api.queues.call(queueId);
      await fetchDoctorData();
    } catch (err) {
      alert(err.message || 'Gagal memanggil pasien');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecall = async (queueId) => {
    try {
      setActionLoading(true);
      await api.queues.recall(queueId);
      await fetchDoctorData();
    } catch (err) {
      alert(err.message || 'Gagal memanggil ulang pasien');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = async (queueId) => {
    try {
      setActionLoading(true);
      await api.queues.start(queueId);
      await fetchDoctorData();
    } catch (err) {
      alert(err.message || 'Gagal memulai konsultasi');
    } finally {
      setActionLoading(false);
    }
  };

  const openFinishModal = (queue) => {
    setSelectedQueueToFinish(queue);
    setDiagnosisNotes(queue.diagnosisNotes || '');
    setFinishModalOpen(true);
  };

  const handleFinishSubmit = async (e) => {
    e.preventDefault();
    if (!selectedQueueToFinish) return;

    try {
      setActionLoading(true);
      await api.queues.finish(selectedQueueToFinish.id, diagnosisNotes);
      setFinishModalOpen(false);
      setSelectedQueueToFinish(null);
      setDiagnosisNotes('');
      await fetchDoctorData();
    } catch (err) {
      alert(err.message || 'Gagal menyelesaikan pemeriksaan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkip = async (queueId) => {
    if (!window.confirm('Apakah Anda yakin ingin melewati pasien ini?')) return;

    try {
      setActionLoading(true);
      await api.queues.skip(queueId);
      await fetchDoctorData();
    } catch (err) {
      alert(err.message || 'Gagal melewati antrean');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Menyiapkan Ruang Praktik Dokter...</p>
      </div>
    );
  }

  const activePatient = data?.activePatient;
  const queues = data?.queues || [];
  const stats = data?.stats || {};

  return (
    <div className="space-y-6">
      {/* Header Info Dokter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
            {data?.doctor?.polyclinic?.name} &bull; {data?.doctor?.roomNumber}
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-2">
            Selamat Bertugas, {user?.name}
          </h1>
          <p className="text-xs text-slate-500">
            Jam Praktik: {data?.doctor?.startTime} - {data?.doctor?.endTime} WIB &bull; Kuota Harian: {data?.doctor?.quotaPerDay} Pasien
          </p>
        </div>

        <button
          onClick={fetchDoctorData}
          disabled={actionLoading}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
          Segarkan Data
        </button>
      </div>

      {/* Ringkasan Statistik Singkat */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Total Terdaftar</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{stats.total || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-blue-500 uppercase">Menunggu (Check-in)</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{stats.checkedIn || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-emerald-500 uppercase">Selesai Diperiksa</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats.completed || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-amber-500 uppercase">Rata-rata Durasi</p>
          <p className="text-2xl font-black text-amber-600 mt-1">
            ~{stats.actualAvgDuration || 10} <span className="text-xs font-bold">menit</span>
          </p>
        </div>
      </div>

      {/* PANEL UTAMA: Pasien yang Sedang Aktif (Hero Card) */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 sm:p-8 rounded-3xl shadow-xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-amber-400 text-slate-950 text-xs font-black rounded-full uppercase tracking-wider">
                {activePatient ? (activePatient.status === 'CALLING' ? 'SEDANG DIPANGGIL' : 'SEDANG KONSULTASI') : 'MENUNGGU PASIEN'}
              </span>
              {activePatient && (
                <span className="text-xs text-slate-300">
                  Panggilan ke-{activePatient.callCount}
                </span>
              )}
            </div>

            {activePatient ? (
              <div>
                <div className="flex items-baseline gap-4">
                  <span className="text-5xl sm:text-6xl font-black font-mono text-amber-400">
                    {activePatient.ticketNumber}
                  </span>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold">{activePatient.patient?.name}</h2>
                    <p className="text-xs text-slate-300">
                      NIK: {activePatient.patient?.nik} &bull; HP: {activePatient.patient?.phone}
                    </p>
                  </div>
                </div>
                <div className="mt-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-xs text-slate-300 max-w-xl">
                  <strong>Keluhan:</strong> {activePatient.complaint || 'Tidak ada catatan keluhan.'}
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold text-slate-300">Belum Ada Pasien di Ruang Pemeriksaan</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Pilih pasien dari daftar antrean yang sudah check-in di bawah untuk mulai memanggil.
                </p>
              </div>
            )}
          </div>

          {/* Tombol Kontrol Ruang Pemeriksaan */}
          {activePatient && (
            <div className="flex flex-wrap gap-2.5 w-full lg:w-auto">
              {/* Tombol Riwayat Medis Pasien */}
              <button
                type="button"
                onClick={() => openPatientHistory(activePatient.patientId)}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 border border-slate-700 shadow-sm"
                title="Lihat Rekam Medis & Riwayat Pasien Sebelumnya"
              >
                <FolderHeart className="w-4 h-4 text-primary-400" />
                Riwayat Medis
              </button>

              {/* Tombol Panggil Ulang */}
              <button
                onClick={() => handleRecall(activePatient.id)}
                disabled={actionLoading}
                className="px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md shadow-amber-500/20"
              >
                <RotateCcw className="w-4 h-4" />
                Panggil Ulang
              </button>

              {/* Tombol Mulai Konsultasi (Jika masih CALLING) */}
              {activePatient.status === 'CALLING' && (
                <button
                  onClick={() => handleStart(activePatient.id)}
                  disabled={actionLoading}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md shadow-blue-600/20"
                >
                  <Play className="w-4 h-4" />
                  Mulai Konsultasi
                </button>
              )}

              {/* Tombol Selesai Konsultasi */}
              <button
                onClick={() => openFinishModal(activePatient)}
                disabled={actionLoading}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                Selesai
              </button>

              {/* Tombol Lewati */}
              <button
                onClick={() => handleSkip(activePatient.id)}
                disabled={actionLoading}
                className="px-3.5 py-3 bg-slate-700 hover:bg-rose-600 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
                title="Lewati Pasien Tidak Hadir"
              >
                <SkipForward className="w-4 h-4" />
                Lewati
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabel Seluruh Antrean Pasien Dokter Hari Ini */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Daftar Antrean Pasien Hari Ini</h2>
            <p className="text-xs text-slate-500">Urutan antrean berdasarkan nomor tiket dan waktu check-in</p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
            {queues.length} Pasien
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">No. Tiket</th>
                <th className="px-6 py-3.5">Nama Pasien</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Keluhan</th>
                <th className="px-6 py-3.5">Check-in</th>
                <th className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {queues.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                    Belum ada antrean untuk hari ini.
                  </td>
                </tr>
              ) : (
                queues.map((q) => {
                  const isReadyToCall = q.status === 'CHECKED_IN';
                  const isCurrentActive = ['CALLING', 'IN_CONSULTATION'].includes(q.status);

                  return (
                    <tr
                      key={q.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isCurrentActive ? 'bg-primary-50/40 font-semibold' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono font-black text-base text-slate-800">
                          {q.ticketNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => openPatientHistory(q.patientId)}
                          className="text-left group hover:text-primary-600 transition-colors"
                          title="Klik untuk melihat rekam medis pasien"
                        >
                          <div className="font-bold text-slate-800 group-hover:text-primary-600 flex items-center gap-1.5">
                            {q.patient?.name}
                            <FolderHeart className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary-600" />
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">{q.patient?.nik}</div>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <Badge status={q.status} />
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-xs text-slate-600">
                        {q.complaint || '-'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {q.checkInTime ? format(new Date(q.checkInTime), 'HH:mm') : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isReadyToCall && (
                            <button
                              onClick={() => handleCall(q.id)}
                              disabled={actionLoading}
                              className="px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              Panggil
                            </button>
                          )}

                          {q.status === 'CALLING' && (
                            <button
                              onClick={() => handleStart(q.id)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all"
                            >
                              Mulai
                            </button>
                          )}

                          {q.status === 'IN_CONSULTATION' && (
                            <button
                              onClick={() => openFinishModal(q)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
                            >
                              Selesai
                            </button>
                          )}

                          {['CHECKED_IN', 'CALLING'].includes(q.status) && (
                            <button
                              onClick={() => handleSkip(q.id)}
                              disabled={actionLoading}
                              className="px-2.5 py-1.5 text-slate-400 hover:text-rose-600 rounded-lg text-xs transition-colors"
                              title="Lewati"
                            >
                              <SkipForward className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Selesai Konsultasi & Catatan Diagnosis */}
      <Modal
        isOpen={finishModalOpen}
        onClose={() => setFinishModalOpen(false)}
        title={`Selesai Pemeriksaan: ${selectedQueueToFinish?.patient?.name} (${selectedQueueToFinish?.ticketNumber})`}
      >
        <form onSubmit={handleFinishSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Catatan Medis / Resep Obat (Diagnosis)
            </label>
            <textarea
              rows={4}
              required
              placeholder="Contoh: Paracetamol 500mg 3x1, Istirahat cukup, Kontrol ulang 3 hari jika belum membaik."
              value={diagnosisNotes}
              onChange={(e) => setDiagnosisNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setFinishModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Simpan & Selesaikan
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Riwayat Rekam Medis Pasien untuk Dokter */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title={`Riwayat Rekam Medis: ${historyPatient?.name || 'Pasien'}`}
        maxWidth="max-w-2xl"
      >
        {loadingHistory ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Memuat riwayat rekam medis pasien...
          </div>
        ) : historyPatient ? (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center text-xs">
              <div>
                <p className="font-bold text-slate-800 text-sm">{historyPatient.name}</p>
                <p className="text-slate-500 font-mono mt-0.5">
                  NIK: {historyPatient.nik} &bull; HP: {historyPatient.phone || '-'}
                </p>
              </div>
              <span className="px-3 py-1 bg-primary-100 text-primary-700 font-bold rounded-full font-mono">
                {historyPatient.queues?.length || 0} Kunjungan
              </span>
            </div>

            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
              {historyPatient.queues?.length === 0 ? (
                <p className="text-center text-slate-400 py-6 text-xs">
                  Pasien belum memiliki riwayat kunjungan sebelumnya.
                </p>
              ) : (
                historyPatient.queues.map((q) => (
                  <div key={q.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <strong className="text-slate-800">{q.polyclinic?.name}</strong>{' '}
                        <span className="text-slate-400 font-mono">({q.ticketNumber})</span>
                      </div>
                      <span className="text-slate-400 font-medium">
                        {format(new Date(q.queueDate), 'dd MMMM yyyy')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                      <strong className="text-slate-700">Keluhan:</strong> {q.complaint || '-'}
                    </div>

                    <div className="text-xs text-emerald-950 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-100">
                      <strong className="text-emerald-800">Diagnosis & Resep:</strong>{' '}
                      {q.diagnosisNotes || <span className="italic text-slate-400">Tidak ada catatan diagnosis.</span>}
                    </div>

                    <div className="text-[11px] text-slate-400">
                      Dokter: {q.doctor?.user?.name} &bull; Status: <strong>{q.status}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

