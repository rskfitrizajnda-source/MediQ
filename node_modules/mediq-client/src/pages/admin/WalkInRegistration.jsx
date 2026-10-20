import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { QRCodeSVG } from 'qrcode.react';
import {
  UserPlus,
  Printer,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Building,
  User,
  CreditCard,
  Phone,
} from 'lucide-react';

export default function WalkInRegistration() {
  const [polyclinics, setPolyclinics] = useState([]);
  const [selectedPolyclinic, setSelectedPolyclinic] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');

  // Identitas Pasien Walk-in
  const [nik, setNik] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState('L');
  const [complaint, setComplaint] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdTicket, setCreatedTicket] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.clinic.getPolyclinics();
        if (res.success && res.data.length > 0) {
          setPolyclinics(res.data);
          setSelectedPolyclinic(res.data[0].id);
        }
      } catch (err) {
        setError('Gagal memuat data poliklinik');
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (selectedPolyclinic) {
      const poly = polyclinics.find((p) => p.id === selectedPolyclinic);
      if (poly && poly.doctors) {
        setDoctors(poly.doctors);
        if (poly.doctors.length > 0) {
          setSelectedDoctor(poly.doctors[0].id);
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
      setError('NIK harus 16 digit.');
      return;
    }

    if (!selectedDoctor) {
      setError('Pilih dokter pemeriksa.');
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
        complaint: complaint || 'Pemeriksaan Walk-in',
      };

      const res = await api.queues.walkIn(payload);
      if (res.success && res.data) {
        setCreatedTicket(res.data);
        // Reset form
        setNik('');
        setName('');
        setPhone('');
        setEmail('');
        setAddress('');
        setComplaint('');
      }
    } catch (err) {
      setError(err.message || 'Pendaftaran walk-in gagal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Pendaftaran Pasien Walk-In</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pendaftaran langsung di resepsionis klinik. Pasien otomatis berstatus <strong>CHECKED_IN</strong>.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tiket Baru Dicetak */}
      {createdTicket && (
        <div className="bg-white rounded-3xl border-2 border-emerald-400 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Tiket Berhasil Diterbitkan!</h3>
                <p className="text-xs text-slate-500">Pasien sudah masuk ke dalam daftar antrean aktif.</p>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4" /> Cetak Tiket
            </button>
          </div>

          <div
            id="printable-ticket"
            className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Nomor Antrean</span>
              <div className="text-5xl font-black font-mono text-primary-600">
                {createdTicket.ticketNumber}
              </div>
              <p className="text-sm font-bold text-slate-800 mt-1">
                {createdTicket.patient?.name}
              </p>
              <p className="text-xs text-slate-500">
                {createdTicket.polyclinic?.name} &bull; {createdTicket.doctor?.user?.name}
              </p>
            </div>

            <div className="p-2 bg-white rounded-xl border border-slate-200">
              <QRCodeSVG value={createdTicket.bookingCode} size={110} />
            </div>
          </div>
        </div>
      )}

      {/* Form Walk-in */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <Building className="w-4 h-4 text-primary-600" />
            Layanan Poliklinik & Dokter
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Pilih Poliklinik
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
                Dokter Bertugas
              </label>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.user?.name} - {d.roomNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <User className="w-4 h-4 text-primary-600" />
            Identitas Pasien
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                NIK (KTP)
              </label>
              <input
                type="text"
                required
                maxLength={16}
                placeholder="3171xxxxxxxxxxxx"
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Pasien
              </label>
              <input
                type="text"
                required
                placeholder="Nama Lengkap"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                No. HP / WhatsApp
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
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Keluhan Pasien (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Sakit kepala, pusing mual"
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? 'Mendaftarkan...' : 'Terbitkan Nomor Antrean Walk-in'}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}

