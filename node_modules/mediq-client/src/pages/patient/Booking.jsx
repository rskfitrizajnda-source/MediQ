import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import {
  Calendar,
  Clock,
  User,
  Phone,
  CreditCard,
  FileText,
  Building,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

export default function Booking() {
  const navigate = useNavigate();

  const [polyclinics, setPolyclinics] = useState([]);
  const [selectedPolyclinic, setSelectedPolyclinic] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [queueDate, setQueueDate] = useState(new Date().toISOString().slice(0, 10));

  // Data diri pasien
  const [nik, setNik] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState('L');
  const [complaint, setComplaint] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Ambil daftar poliklinik
  useEffect(() => {
    async function loadPolyclinics() {
      try {
        const res = await api.clinic.getPolyclinics();
        if (res.success) {
          setPolyclinics(res.data);
          if (res.data.length > 0) {
            setSelectedPolyclinic(res.data[0].id);
          }
        }
      } catch (err) {
        setError('Gagal memuat daftar poliklinik.');
      }
    }
    loadPolyclinics();
  }, []);

  // Update daftar dokter saat poli berubah
  useEffect(() => {
    if (selectedPolyclinic) {
      const currentPoly = polyclinics.find((p) => p.id === selectedPolyclinic);
      if (currentPoly && currentPoly.doctors) {
        setDoctors(currentPoly.doctors);
        if (currentPoly.doctors.length > 0) {
          setSelectedDoctor(currentPoly.doctors[0].id);
        } else {
          setSelectedDoctor('');
        }
      }
    }
  }, [selectedPolyclinic, polyclinics]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (nik.length < 16) {
      setError('Nomor NIK harus berjumlah 16 digit sesuai KTP.');
      return;
    }

    if (!selectedDoctor) {
      setError('Silakan pilih dokter yang bertugas.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        nik,
        name,
        phone,
        email,
        address,
        gender,
        doctorId: selectedDoctor,
        polyclinicId: selectedPolyclinic,
        queueDate,
        complaint,
      };

      const res = await api.patients.book(payload);
      if (res.success && res.data) {
        // Berhasil booking, arahkan langsung ke halaman E-Tiket
        navigate(`/patient/ticket/${res.data.bookingCode}`);
      }
    } catch (err) {
      setError(err.message || 'Pendaftaran antrean gagal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
        {/* Header Form */}
        <div className="bg-gradient-to-r from-primary-600 to-clinic-blue p-6 sm:p-8 text-white">
          <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm inline-block mb-3">
            Pendaftaran Mandiri Pasien
          </span>
          <h1 className="text-2xl sm:text-3xl font-black">Booking Antrean Online</h1>
          <p className="text-primary-100 text-sm mt-1">
            Isi formulir untuk mendapatkan nomor antrean digital dan perkiraan waktu konsultasi (Dynamic ETA).
          </p>
        </div>

        {error && (
          <div className="m-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Bagian 1: Pemilihan Layanan */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <Building className="w-4 h-4 text-primary-600" />
              1. Pilih Poliklinik & Dokter
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Poliklinik Tujuan
                </label>
                <select
                  value={selectedPolyclinic}
                  onChange={(e) => setSelectedPolyclinic(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  {polyclinics.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Kode {p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Dokter Pemeriksa
                </label>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  disabled={doctors.length === 0}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white disabled:bg-slate-50"
                >
                  {doctors.length === 0 ? (
                    <option value="">Tidak ada dokter aktif</option>
                  ) : (
                    doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.user?.name || 'Dokter'} - {d.roomNumber} (Maks {d.quotaPerDay} Pasien)
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tanggal Kunjungan
              </label>
              <input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={queueDate}
                onChange={(e) => setQueueDate(e.target.value)}
                className="w-full sm:w-1/2 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Bagian 2: Data Identitas Pasien */}
          <div className="space-y-4 pt-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-primary-600" />
              2. Data Identitas Pasien
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  NIK (KTP 16 Digit)
                </label>
                <input
                  type="text"
                  maxLength={16}
                  required
                  placeholder="3171xxxxxxxxxxxx"
                  value={nik}
                  onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Lengkap Pasien
                </label>
                <input
                  type="text"
                  required
                  placeholder="Sesuai KTP"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nomor Telepon / WhatsApp
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0812xxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Jenis Kelamin
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email (Opsional untuk E-Tiket)
                </label>
                <input
                  type="email"
                  placeholder="pasien@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Alamat Tempat Tinggal
                </label>
                <input
                  type="text"
                  placeholder="Jl. Mawar No. 10"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Keluhan / Gejala Utama
              </label>
              <textarea
                rows={2}
                placeholder="Deskripsikan keluhan medis yang dirasakan..."
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl text-base transition-all shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Mendaftarkan Antrean...' : 'Dapatkan Nomor Antrean & E-Tiket'}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}

