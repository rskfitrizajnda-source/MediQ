import React, { useState } from 'react';
import { api } from '../../services/api';
import Badge from '../../components/Badge';
import {
  FileText,
  Search,
  User,
  Calendar,
  Clock,
  Printer,
  AlertCircle,
  Pill,
  Stethoscope,
  ChevronRight,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function PatientHistory() {
  const [nik, setNik] = useState('');
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (targetNik) => {
    const searchNik = targetNik || nik;
    if (!searchNik || searchNik.trim().length < 16) {
      setError('Masukkan 16 digit NIK KTP pasien.');
      return;
    }

    setLoading(true);
    setError(null);
    setPatientData(null);

    try {
      const res = await api.patients.getHistory(searchNik.trim());
      if (res.success && res.data) {
        setPatientData(res.data);
      } else {
        setError('Data pasien tidak ditemukan.');
      }
    } catch (err) {
      setError(err.message || 'Riwayat pasien tidak ditemukan.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSearch(nik);
  };

  const handleQuickLookup = (quickNik) => {
    setNik(quickNik);
    handleSearch(quickNik);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header Halaman */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-bold uppercase tracking-wider inline-block mb-2">
              Rekam Medis & Riwayat Kunjungan
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Riwayat Berobat Pasien
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pantau riwayat kunjungan klinik, catatan diagnosis dokter, dan resep obat yang pernah diberikan.
            </p>
          </div>

          {patientData && (
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" /> Cetak Resume Riwayat
            </button>
          )}
        </div>

        {/* Form Pencarian NIK */}
        <form onSubmit={handleFormSubmit} className="pt-2 flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              maxLength={16}
              placeholder="Masukkan 16 digit NIK pasien (cth: 3171012304950001)..."
              value={nik}
              onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-primary-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Mencari...' : 'Cari Riwayat'}
          </button>
        </form>

        {/* Demo Shortcut NIK */}
        <div className="pt-2 border-t border-slate-100">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Pencarian Cepat Contoh (Klik untuk memuat):
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLookup('3171012304950001')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-primary-50 hover:text-primary-700 rounded-lg font-medium text-slate-600 transition-colors"
            >
              Rian Hidayat (3171...0001)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLookup('3171016508980002')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-primary-50 hover:text-primary-700 rounded-lg font-medium text-slate-600 transition-colors"
            >
              Dewi Lestari (3171...0002)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLookup('3171011111900003')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-primary-50 hover:text-primary-700 rounded-lg font-medium text-slate-600 transition-colors"
            >
              Ahmad Fauzi (3171...0003)
            </button>
          </div>
        </div>
      </div>

      {/* Pesan Error */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Profil Pasien Terpilih */}
      {patientData && (
        <div id="printable-ticket" className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-clinic-blue text-white flex items-center justify-center font-black text-xl shadow-md">
                  {patientData.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">{patientData.name}</h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    NIK: {patientData.nik} &bull; Gender: {patientData.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right text-xs text-slate-500">
                <span className="font-bold text-slate-700 block">Total Kunjungan:</span>
                <span className="text-lg font-black text-primary-600 font-mono">
                  {patientData.queues?.length || 0} Kali
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 block font-semibold">Nomor Telepon:</span>
                <span className="font-bold text-slate-800">{patientData.phone || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Email:</span>
                <span className="font-bold text-slate-800">{patientData.email || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Alamat:</span>
                <span className="font-bold text-slate-800">{patientData.address || '-'}</span>
              </div>
            </div>
          </div>

          {/* Daftar Riwayat Kunjungan / Rekam Medis */}
          <div className="space-y-4">
            <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-600" />
              Linimasa Rekam Medis & Riwayat Pemeriksaan
            </h2>

            {patientData.queues?.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center text-slate-400 border border-slate-200/80">
                Belum ada catatan riwayat pemeriksaan untuk pasien ini.
              </div>
            ) : (
              <div className="space-y-4">
                {patientData.queues.map((q, idx) => (
                  <div
                    key={q.id}
                    className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                          #{patientData.queues.length - idx}
                        </span>
                        <div>
                          <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                            <span>{q.polyclinic?.name}</span>
                            <span className="text-xs text-slate-400 font-mono">&bull; {q.ticketNumber}</span>
                          </div>
                          <p className="text-xs text-slate-400">
                            Dokter: {q.doctor?.user?.name} ({q.doctor?.roomNumber})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-500">
                          {format(new Date(q.queueDate), 'dd MMMM yyyy', { locale: id })}
                        </span>
                        <Badge status={q.status} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Keluhan Pasien */}
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-primary-500" />
                          Keluhan Awal Pasien
                        </span>
                        <p className="text-slate-700 leading-relaxed font-medium">
                          {q.complaint || 'Pemeriksaan rutin / tidak ada catatan keluhan.'}
                        </p>
                      </div>

                      {/* Catatan Dokter & Resep Obat */}
                      <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                          <Pill className="w-3.5 h-3.5 text-emerald-600" />
                          Diagnosis & Catatan Resep Dokter
                        </span>
                        <p className="text-emerald-950 leading-relaxed font-medium">
                          {q.diagnosisNotes || (
                            <span className="text-slate-400 italic">
                              {q.status === 'COMPLETED'
                                ? 'Konsultasi selesai tanpa resep tambahan.'
                                : 'Pemeriksaan belum selesai / belum ada diagnosis.'}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Waktu Pelayanan */}
                    <div className="pt-2 flex flex-wrap items-center justify-between text-[11px] text-slate-400 border-t border-slate-50">
                      <span>Kode Booking: <strong className="font-mono text-slate-600">{q.bookingCode}</strong></span>
                      {q.startTime && q.endTime && (
                        <span>
                          Waktu Pelayanan:{' '}
                          <strong className="text-slate-600">
                            {format(new Date(q.startTime), 'HH:mm')} - {format(new Date(q.endTime), 'HH:mm')} WIB
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

