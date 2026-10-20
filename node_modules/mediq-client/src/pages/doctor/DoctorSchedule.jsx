import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Clock, Users, Calendar, Save, AlertCircle, CheckCircle } from 'lucide-react';

export default function DoctorSchedule() {
  const [schedule, setSchedule] = useState({
    quotaPerDay: 30,
    avgConsultationMinutes: 12,
    startTime: '08:00',
    endTime: '16:00',
    scheduleDays: 'Senin,Selasa,Rabu,Kamis,Jumat',
    isActive: true,
    roomNumber: 'Ruang 101',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    async function loadSchedule() {
      try {
        const res = await api.doctors.getSchedule();
        if (res.success && res.data) {
          setSchedule(res.data);
        }
      } catch (err) {
        setErrorMsg('Gagal memuat jadwal dokter.');
      } finally {
        setLoading(false);
      }
    }
    loadSchedule();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await api.doctors.updateSchedule(schedule);
      if (res.success) {
        setSuccessMsg('Jadwal dan kuota berhasil diperbarui.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan perubahan.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Memuat data jadwal dokter...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">Pengaturan Jadwal & Kuota Praktik</h1>
        <p className="text-xs text-slate-500 mt-1">
          Konfigurasi kuota harian dan durasi estimasi konsultasi untuk akurasi Dynamic ETA pasien.
        </p>

        {successMsg && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kuota Pasien Per Hari
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={schedule.quotaPerDay}
                  onChange={(e) => setSchedule({ ...schedule, quotaPerDay: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Rata-rata Durasi (Menit)
              </label>
              <input
                type="number"
                min="3"
                max="60"
                required
                value={schedule.avgConsultationMinutes}
                onChange={(e) =>
                  setSchedule({ ...schedule, avgConsultationMinutes: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Jam Mulai Praktik
              </label>
              <input
                type="time"
                required
                value={schedule.startTime}
                onChange={(e) => setSchedule({ ...schedule, startTime: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Jam Selesai Praktik
              </label>
              <input
                type="time"
                required
                value={schedule.endTime}
                onChange={(e) => setSchedule({ ...schedule, endTime: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nomor & Nama Ruang Praktik
              </label>
              <input
                type="text"
                required
                value={schedule.roomNumber}
                onChange={(e) => setSchedule({ ...schedule, roomNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Hari Praktik Aktif
              </label>
              <input
                type="text"
                placeholder="Contoh: Senin,Selasa,Rabu,Kamis,Jumat"
                value={schedule.scheduleDays}
                onChange={(e) => setSchedule({ ...schedule, scheduleDays: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={schedule.isActive}
                onChange={(e) => setSchedule({ ...schedule, isActive: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
              />
              <span className="text-sm font-semibold text-slate-700">Status Dokter Aktif Menerima Pasien</span>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

