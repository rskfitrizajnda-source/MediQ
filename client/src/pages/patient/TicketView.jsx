import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import Badge from '../../components/Badge';
import { QRCodeSVG } from 'qrcode.react';
import {
  Clock,
  Users,
  MapPin,
  Calendar,
  Printer,
  BellRing,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Activity,
  ArrowLeft,
  History,
  Pill,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function TicketView() {
  const { bookingCode } = useParams();
  const { socket } = useSocket();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCallingNow, setIsCallingNow] = useState(false);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const res = await api.patients.getTicket(bookingCode);
      if (res.success && res.data) {
        setTicket(res.data);
        if (res.data.status === 'CALLING') {
          setIsCallingNow(true);
        }
      } else {
        setError('Tiket tidak ditemukan.');
      }
    } catch (err) {
      setError(err.message || 'Gagal mengambil data tiket.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookingCode) {
      fetchTicket();
    }
  }, [bookingCode]);

  // Real-time synchronization
  useEffect(() => {
    if (socket && ticket?.id) {
      socket.emit('join:patient', ticket.id);

      const handleCalled = (payload) => {
        if (payload.queueId === ticket.id) {
          setIsCallingNow(true);
          // Play audio notification on patient phone/browser if supported
          try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            osc.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.5);
          } catch (e) {}
          fetchTicket();
        }
      };

      const handleStatusChanged = (updatedQueue) => {
        if (updatedQueue.id === ticket.id) {
          fetchTicket();
        }
      };

      socket.on('queue:called', handleCalled);
      socket.on('queue:my_status_changed', handleStatusChanged);

      return () => {
        socket.off('queue:called', handleCalled);
        socket.off('queue:my_status_changed', handleStatusChanged);
      };
    }
  }, [socket, ticket?.id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Memuat E-Tiket Pasien...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Tiket Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500">{error || 'Kode booking tidak valid.'}</p>
        <Link
          to="/patient/booking"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Buat Booking Baru
        </Link>
      </div>
    );
  }

  const isCheckedIn = ['CHECKED_IN', 'CALLING', 'IN_CONSULTATION', 'COMPLETED'].includes(ticket.status);
  const etaTime = ticket.eta?.estimatedTime ? new Date(ticket.eta.estimatedTime) : null;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Banner Panggilan Nyaring jika pasien sedang dipanggil! */}
      {isCallingNow && ticket.status === 'CALLING' && (
        <div className="mb-6 p-5 rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/25 animate-bounce-subtle flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl">
            <BellRing className="w-8 h-8 animate-ping" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-black tracking-wide uppercase">Giliran Anda Dipanggil!</h3>
            <p className="text-sm text-indigo-100">
              Silakan segera menuju ke <span className="font-bold underline">{ticket.doctor?.roomNumber}</span> untuk bertemu {ticket.doctor?.user?.name}.
            </p>
          </div>
        </div>
      )}

      {/* Banner Pemberitahuan SELESAI DILAYANI */}
      {ticket.status === 'COMPLETED' && (
        <div className="mb-6 p-6 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xl shadow-emerald-500/25 animate-fadeIn space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-wide uppercase flex items-center gap-2">
                Pemeriksaan Telah Selesai! <Sparkles className="w-4 h-4 text-amber-300" />
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Konsultasi dengan {ticket.doctor?.user?.name} telah selesai.
              </p>
            </div>
          </div>

          <div className="p-3 bg-black/15 rounded-2xl backdrop-blur-sm text-xs text-white/95 border border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <span className="font-medium">Langkah Berikutnya:</span>
            <span className="font-extrabold bg-white text-emerald-800 px-3 py-1 rounded-xl shadow-sm">
              Silakan menuju ke Loket Farmasi / Kasir &rarr;
            </span>
          </div>
        </div>
      )}

      {/* Kartu E-Tiket Digital (Printable) */}
      <div
        id="printable-ticket"
        className="bg-white rounded-3xl shadow-lg border border-slate-200/80 overflow-hidden relative"
      >
        {/* Header Tiket */}
        <div
          className="p-6 text-white text-center relative overflow-hidden"
          style={{ backgroundColor: ticket.polyclinic?.color || '#0284c7' }}
        >
          <div className="relative z-10 space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-widest bg-black/20 px-3 py-1 rounded-full">
              E-Tiket Antrean Klinik MediQ
            </span>
            <h1 className="text-2xl font-black">{ticket.polyclinic?.name}</h1>
            <p className="text-xs text-white/90">
              {ticket.doctor?.user?.name} &bull; {ticket.doctor?.roomNumber}
            </p>
          </div>
        </div>

        {/* Nomor Antrean Raksasa */}
        <div className="py-8 px-6 text-center border-b border-dashed border-slate-200 bg-slate-50/50">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
            Nomor Antrean Anda
          </p>
          <div className="text-6xl sm:text-7xl font-black text-slate-900 tracking-tight font-mono">
            {ticket.ticketNumber}
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            <Badge status={ticket.status} />
          </div>
        </div>

        {/* JIKA SUDAH SELESAI: Tampilkan Catatan Diagnosis Medis & Resep Obat */}
        {ticket.status === 'COMPLETED' ? (
          <div className="p-6 bg-emerald-50/70 border-b border-emerald-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-emerald-600" />
                Catatan Dokter & Resep Obat Digital
              </span>
              {ticket.endTime && (
                <span className="text-[11px] font-semibold text-emerald-700 font-mono">
                  Selesai pk {format(new Date(ticket.endTime), 'HH:mm')} WIB
                </span>
              )}
            </div>

            <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-sm text-xs text-emerald-950 font-medium leading-relaxed">
              {ticket.diagnosisNotes ? (
                ticket.diagnosisNotes
              ) : (
                <span className="italic text-slate-400">
                  Konsultasi selesai. Tidak ada resep obat khusus yang diperlukan.
                </span>
              )}
            </div>

            <p className="text-[11px] text-emerald-800 italic">
              *Tunjukkan layar e-tiket ini kepada petugas Farmasi atau Kasir untuk verifikasi obat dan administrasi.
            </p>
          </div>
        ) : (
          /* JIKA BELUM SELESAI: Tampilkan Dynamic ETA & Estimasi Waktu */
          <div className="p-6 bg-primary-50/60 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-primary-800 font-bold text-sm">
                <Clock className="w-4 h-4 text-primary-600" />
                Dynamic ETA (Waktu Tunggu Dinamis)
              </div>
              <button
                onClick={fetchTicket}
                className="text-xs text-primary-600 hover:text-primary-800 flex items-center gap-1 font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Segarkan
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-2xl border border-primary-100 shadow-sm text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400">Estimasi Dipanggil</p>
                <p className="text-base font-extrabold text-primary-700 mt-0.5">
                  {etaTime ? format(etaTime, 'HH:mm') + ' WIB' : '-'}
                </p>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-primary-100 shadow-sm text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400">Sisa Antrean Depan</p>
                <p className="text-base font-extrabold text-slate-800 mt-0.5">
                  {ticket.eta?.patientsAhead ?? 0} Orang
                </p>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-primary-100 shadow-sm text-center col-span-2 sm:col-span-1">
                <p className="text-[10px] uppercase font-bold text-slate-400">Sedang Dilayani</p>
                <p className="text-base font-extrabold text-slate-800 mt-0.5 font-mono">
                  {ticket.eta?.currentServingTicket || 'Menunggu'}
                </p>
              </div>
            </div>

            {!isCheckedIn && (
              <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                <span>
                  Status <strong>PENDING</strong>. Harap tunjukkan QR Code di bawah kepada resepsionis atau scan di kios saat tiba di klinik.
                </span>
              </div>
            )}
          </div>
        )}

        {/* QR Code Check-in */}
        <div className="p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-sm inline-block">
            <QRCodeSVG
              value={ticket.bookingCode}
              size={180}
              level="H"
              includeMargin={false}
            />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">
              Kode Booking Digital
            </p>
            <p className="text-lg font-black font-mono tracking-wider text-slate-800">
              {ticket.bookingCode}
            </p>
          </div>
        </div>

        {/* Detail Pasien & Kunjungan */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 text-xs space-y-2.5">
          <div className="flex justify-between text-slate-600">
            <span>Nama Pasien:</span>
            <span className="font-bold text-slate-800">{ticket.patient?.name}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>NIK:</span>
            <span className="font-mono text-slate-800">{ticket.patient?.nik}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Tanggal Kunjungan:</span>
            <span className="font-semibold text-slate-800">
              {format(new Date(ticket.queueDate), 'dd MMMM yyyy', { locale: id })}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Keluhan:</span>
            <span className="text-slate-700 italic">{ticket.complaint || '-'}</span>
          </div>
        </div>
      </div>

      {/* Tombol Aksi Bawah */}
      <div className="mt-6 space-y-2.5">
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" /> Cetak / Simpan Tiket
          </button>
          <Link
            to="/patient/booking"
            className="px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl font-bold text-sm transition-colors text-center"
          >
            Selesai
          </Link>
        </div>

        <Link
          to="/patient/history"
          className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-blue-200"
        >
          <History className="w-4 h-4" />
          Lihat Riwayat Berobat & Catatan Medis Saya
        </Link>
      </div>
    </div>
  );
}

