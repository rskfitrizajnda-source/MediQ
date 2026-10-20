import React from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Search,
  Tv,
  Stethoscope,
  UserCheck,
  Clock,
  Volume2,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-primary-500" />
            Sistem Manajemen Antrean Klinik Generasi Terbaru
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Pelayanan Klinik Lebih Efisien dengan{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-clinic-blue">
              MediQ
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Integrasi lengkap pendaftaran mandiri pasien, e-tiket QR digital, kalkulasi perkiraan waktu
            tunggu dinamis (Dynamic ETA), panggilan audio suara pintar di TV, dan kontrol dokter real-time.
          </p>
        </div>

        {/* Portal Cards Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          {/* 1. Pasien: Booking */}
          <Link
            to="/patient/booking"
            className="group relative bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-primary-400 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-slate-800 group-hover:text-primary-600 transition-colors">
                Booking Pasien
              </h2>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Pendaftaran mandiri secara online, pilih poli & dokter, langsung dapatkan E-Tiket QR.
              </p>
            </div>
            <div className="mt-5 flex items-center text-xs font-semibold text-primary-600">
              Mulai Pendaftaran &rarr;
            </div>
          </Link>

          {/* 2. Pasien: Lacak Antrean */}
          <Link
            to="/patient/track"
            className="group relative bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-clinic-green transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Search className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                Lacak Tiket Live
              </h2>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Pantau sisa antrean di depan Anda dan hitung Dynamic ETA waktu perkiraan dipanggil.
              </p>
            </div>
            <div className="mt-5 flex items-center text-xs font-semibold text-emerald-600">
              Cek Tiket Anda &rarr;
            </div>
          </Link>

          {/* 3. Pasien: Riwayat Berobat */}
          <Link
            to="/patient/history"
            className="group relative bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-blue-500 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                Riwayat Berobat
              </h2>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Lihat catatan riwayat pemeriksaan masa lalu, diagnosis, dan resep obat berdasarkan NIK.
              </p>
            </div>
            <div className="mt-5 flex items-center text-xs font-semibold text-blue-600">
              Lihat Rekam Medis &rarr;
            </div>
          </Link>

          {/* 4. Smart TV Display */}
          <Link
            to="/display"
            target="_blank"
            className="group relative bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm hover:shadow-xl hover:border-amber-400 transition-all duration-300 flex flex-col justify-between text-white"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Tv className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                Smart TV Display
              </h2>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Papan antrean ruang tunggu dengan sintesis suara panggilan Bahasa Indonesia.
              </p>
            </div>
            <div className="mt-5 flex items-center text-xs font-semibold text-amber-400">
              Buka Layar TV &rarr;
            </div>
          </Link>

          {/* 5. Portal Dokter & Admin */}
          <Link
            to="/login"
            className="group relative bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-clinic-purple transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-slate-800 group-hover:text-purple-600 transition-colors">
                Panel Dokter & Staff
              </h2>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Kontrol antrean dokter, scanner resepsionis, dan pendaftaran pasien walk-in.
              </p>
            </div>
            <div className="mt-5 flex items-center text-xs font-semibold text-purple-600">
              Masuk Dashboard &rarr;
            </div>
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="mt-16 bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-slate-900">Keunggulan Arsitektur MediQ</h2>
            <p className="text-sm text-slate-500 mt-1">Dirancang untuk keandalan dan kenyamanan pasien</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex gap-4 items-start">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Dynamic ETA Engine</h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  Menghitung moving-average durasi konsultasi dokter secara cerdas agar waktu tunggu pasien akurat.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Volume2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Voice Announcer TTS</h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  Panggilan suara jernih otomatis melalui Web Speech API terintegrasi dengan nada lonceng ding-dong.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">E-Tiket & Scanner QR</h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  Check-in kilat tanpa antre manual di resepsionis cukup dengan pemindaian kamera QR barcode tiket.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

