import React, { useState } from 'react';
import { api } from '../../services/api';
import Badge from '../../components/Badge';
import {
  Search,
  User,
  Phone,
  Calendar,
  FileText,
  Clock,
  Pill,
  Printer,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  FolderHeart,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function PatientHistoryLookup() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setError('Masukkan minimal 2 karakter untuk pencarian (Nama, NIK, atau No. HP).');
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedPatient(null);

    try {
      const res = await api.patients.search(searchQuery.trim());
      if (res.success) {
        setSearchResults(res.data);
        if (res.data.length === 0) {
          setError('Tidak ada data pasien yang sesuai.');
        }
      }
    } catch (err) {
      setError(err.message || 'Gagal mencari pasien.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = async (patientId) => {
    setLoadingDetails(true);
    try {
      const res = await api.patients.getHistoryById(patientId);
      if (res.success && res.data) {
        setSelectedPatient(res.data);
      }
    } catch (err) {
      alert(err.message || 'Gagal memuat rekam medis pasien.');
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-bold uppercase tracking-wider inline-block mb-2">
            Pencarian Rekam Medis Pasien
          </span>
          <h1 className="text-2xl font-black text-slate-900">Database & Riwayat Pasien</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cari data riwayat berobat, keluhan, dan resep pasien berdasarkan NIK, Nama, atau Nomor HP.
          </p>
        </div>

        {selectedPatient && (
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" /> Cetak Rekam Medis
          </button>
        )}
      </div>

      {/* Bar Pencarian */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Cari berdasarkan NIK (16 digit), Nama Pasien, atau Nomor Telepon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'Mencari...' : 'Cari Pasien'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Grid Hasil Pencarian dan Detail Rekam Medis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Daftar Pasien Ditemukan */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Hasil Pencarian ({searchResults.length})
            </h2>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {searchResults.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Ketik nama atau NIK pasien di atas untuk melihat data riwayat.
              </div>
            ) : (
              searchResults.map((p) => {
                const isSelected = selectedPatient?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPatient(p.id)}
                    className={`w-full p-4 text-left transition-colors flex items-center justify-between hover:bg-slate-50 ${
                      isSelected ? 'bg-primary-50/70 border-l-4 border-primary-600' : ''
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{p.name}</p>
                      <p className="text-xs text-slate-400 font-mono">NIK: {p.nik}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        HP: {p.phone} &bull; Total: {p._count?.queues || 0} Kunjungan
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Kolom Kanan: Detail Rekam Medis & Riwayat Pasien */}
        <div className="lg:col-span-8 space-y-4">
          {loadingDetails ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200/80">
              Memuat data riwayat rekam medis...
            </div>
          ) : selectedPatient ? (
            <div id="printable-ticket" className="space-y-4">
              {/* Profil Kartu */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">{selectedPatient.name}</h2>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      NIK: {selectedPatient.nik} &bull; Gender: {selectedPatient.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-bold font-mono">
                    {selectedPatient.queues?.length || 0} Kunjungan
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block font-semibold">Telepon / WA:</span>
                    <span className="font-bold text-slate-800">{selectedPatient.phone || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Alamat:</span>
                    <span className="font-bold text-slate-800">{selectedPatient.address || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Email:</span>
                    <span className="font-bold text-slate-800">{selectedPatient.email || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Daftar Riwayat Pemeriksaan */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
                  Riwayat Kunjungan & Catatan Medis Dokter
                </h3>

                {selectedPatient.queues?.map((q, idx) => (
                  <div
                    key={q.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {q.polyclinic?.name}
                          </span>
                          <span className="text-xs font-mono font-bold text-primary-600">
                            ({q.ticketNumber})
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {q.doctor?.user?.name} &bull; {q.doctor?.roomNumber}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">
                          {format(new Date(q.queueDate), 'dd MMMM yyyy', { locale: id })}
                        </span>
                        <div className="mt-1">
                          <Badge status={q.status} />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          Keluhan Pasien:
                        </span>
                        <p className="text-slate-700">{q.complaint || '-'}</p>
                      </div>

                      <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-100">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">
                          Diagnosis & Resep Obat:
                        </span>
                        <p className="text-emerald-950 font-medium">
                          {q.diagnosisNotes || (
                            <span className="text-slate-400 italic">Tidak ada catatan diagnosis.</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-16 text-center text-slate-400 border border-slate-200/80 space-y-2">
              <FolderHeart className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">Pilih Pasien untuk Membuka Riwayat</p>
              <p className="text-xs text-slate-400">
                Gunakan pencarian di atas untuk memilih pasien dan meninjau rekam medis sebelumnya.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

