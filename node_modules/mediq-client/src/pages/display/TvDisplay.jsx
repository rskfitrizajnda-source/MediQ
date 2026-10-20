import React, { useEffect, useState, useRef } from 'react';
import { api } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { announceQueue, playChime } from '../../services/speech';
import {
  Volume2,
  VolumeX,
  Clock,
  Tv,
  Activity,
  Users,
  BellRing,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function TvDisplay() {
  const { socket } = useSocket();

  const [tvData, setTvData] = useState(null);
  const [currentCall, setCurrentCall] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isCallingSpeech, setIsCallingSpeech] = useState(false);

  // Load TV data
  const fetchTvData = async () => {
    try {
      const res = await api.queues.getTvDisplay();
      if (res.success && res.data) {
        setTvData(res.data);
      }
    } catch (err) {
      console.error('Error fetching TV data:', err);
    }
  };

  useEffect(() => {
    fetchTvData();

    // Clock update interval
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(clockTimer);
  }, []);

  // Socket.io Real-time connection
  useEffect(() => {
    if (socket) {
      socket.emit('join:tv');

      const handleCalled = async (payload) => {
        console.log('[TV] Panggilan diterima:', payload);
        setCurrentCall(payload);
        fetchTvData();

        // Putar suara Text-To-Speech jika audio sudah diaktifkan oleh pengguna/petugas
        if (audioEnabled) {
          setIsCallingSpeech(true);
          try {
            await announceQueue({
              ticketNumber: payload.ticketNumber,
              polyclinicName: payload.polyclinicName,
              roomNumber: payload.roomNumber,
              doctorName: payload.doctorName,
              repeatCount: 1,
            });
          } catch (e) {
            console.error('Speech call error:', e);
          } finally {
            setIsCallingSpeech(false);
          }
        }
      };

      const handleRefresh = () => {
        fetchTvData();
      };

      socket.on('queue:called', handleCalled);
      socket.on('tv:refresh', handleRefresh);
      socket.on('queue:status_changed', handleRefresh);

      return () => {
        socket.off('queue:called', handleCalled);
        socket.off('tv:refresh', handleRefresh);
        socket.off('queue:status_changed', handleRefresh);
      };
    }
  }, [socket, audioEnabled]);

  // Handler aktivasi audio (karena browser membatasi autoplay audio tanpa interaksi klik pertama)
  const enableAudio = async () => {
    setAudioEnabled(true);
    await playChime();
  };

  const polyclinics = tvData?.polyclinics || [];
  const settings = tvData?.settings || {};

  // Cari antrean aktif jika belum ada event panggilan langsung
  const activeHeroCall =
    currentCall ||
    polyclinics.find((p) => p.currentCalling)?.currentCalling || {
      ticketNumber: '---',
      polyclinicName: 'Menunggu Panggilan',
      roomNumber: 'Lobi Antrean',
      doctorName: 'Dokter Jaga',
    };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between select-none overflow-hidden font-sans">
      {/* Header Bar */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-8 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
            <Activity className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              {settings.clinicName || 'Klinik Pratama MediQ'}
            </h1>
            <p className="text-xs text-slate-400 font-semibold tracking-wide">
              SISTEM INFORMASI PAPAN ANTREAN DIGITAL
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Audio Status Switch */}
          <button
            onClick={enableAudio}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              audioEnabled
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
            }`}
          >
            {audioEnabled ? (
              <>
                <Volume2 className="w-4 h-4" /> Suara Suara TTS Aktif
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" /> Klik Untuk Aktifkan Suara TV
              </>
            )}
          </button>

          {/* Jam & Tanggal Digital */}
          <div className="text-right">
            <div className="text-2xl font-black font-mono tracking-wider text-primary-400">
              {format(currentTime, 'HH:mm:ss')} <span className="text-xs font-sans">WIB</span>
            </div>
            <div className="text-xs text-slate-400 font-medium">
              {format(currentTime, 'EEEE, dd MMMM yyyy', { locale: id })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Display Body */}
      <main className="flex-1 p-8 grid grid-cols-12 gap-8 items-stretch">
        {/* Kolom Kiri: Panggilan Aktif Terkini (HERO CALL CARD) */}
        <section className="col-span-12 lg:col-span-5 flex flex-col">
          <div className="flex-1 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 rounded-3xl border-2 border-primary-500/40 p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary-600/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex items-center justify-between">
              <span className="px-4 py-1.5 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/30 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <BellRing className={`w-4 h-4 ${isCallingSpeech ? 'animate-bounce' : ''}`} />
                PANGGILAN SAAT INI
              </span>
              {isCallingSpeech && (
                <span className="text-xs font-bold text-primary-400 animate-pulse flex items-center gap-1">
                  <Volume2 className="w-4 h-4" /> Menyiarkan Suara...
                </span>
              )}
            </div>

            {/* Nomor Tiket Raksasa */}
            <div className="my-8 text-center relative z-10">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                NOMOR ANTREAN
              </p>
              <div className="text-7xl sm:text-8xl lg:text-9xl font-black tracking-tight font-mono text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 drop-shadow-lg">
                {activeHeroCall.ticketNumber}
              </div>

              {activeHeroCall.patientName && (
                <p className="text-xl font-bold text-amber-300 mt-2 truncate">
                  {activeHeroCall.patientName}
                </p>
              )}
            </div>

            {/* Lokasi Menuju */}
            <div className="relative z-10 bg-slate-950/60 backdrop-blur-md rounded-2xl p-6 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 font-semibold">Tujuan Poliklinik:</span>
                <span className="font-black text-primary-400 text-lg">
                  {activeHeroCall.polyclinicName || activeHeroCall.polyclinic?.name || '-'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 font-semibold">Ruang Pemeriksaan:</span>
                <span className="font-extrabold text-white text-base">
                  {activeHeroCall.roomNumber || '-'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-slate-800 pt-2">
                <span className="text-slate-400 font-semibold">Dokter Pemeriksa:</span>
                <span className="font-semibold text-slate-200">
                  {activeHeroCall.doctorName || '-'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Kolom Kanan: Multi-Loket Grid Seluruh Poliklinik */}
        <section className="col-span-12 lg:col-span-7 flex flex-col">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Status Seluruh Poliklinik
            </h2>
            <span className="text-xs text-primary-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-ping"></span>
              Real-Time Feed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            {polyclinics.map((p) => {
              const current = p.currentCalling;
              const hasActive = !!current;

              return (
                <div
                  key={p.polyclinic.id}
                  className={`bg-slate-900 rounded-2xl p-5 border flex flex-col justify-between transition-all ${
                    hasActive
                      ? 'border-slate-700 shadow-lg'
                      : 'border-slate-800/80 opacity-90'
                  }`}
                >
                  {/* Header Poli */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: p.polyclinic.color || '#0284c7' }}
                      />
                      <h3 className="font-black text-white text-base">
                        {p.polyclinic.name}
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      Poli {p.polyclinic.code}
                    </span>
                  </div>

                  {/* Sedang Dilayani */}
                  <div className="my-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      SEDANG DILAYANI
                    </span>
                    <div className="text-4xl font-black font-mono text-amber-400 mt-1">
                      {current ? current.ticketNumber : '-'}
                    </div>
                    <div className="text-xs text-slate-300 font-semibold mt-1 truncate">
                      {current ? current.patientName : 'Belum ada antrean'}
                    </div>
                  </div>

                  {/* Antrean Berikutnya & Antre */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800 text-slate-400 font-medium">
                    <div>
                      <span>Berikutnya: </span>
                      <strong className="text-white font-mono">{p.nextTicket}</strong>
                    </div>
                    <div>
                      <span>Menunggu: </span>
                      <strong className="text-primary-400">{p.waitingCount} Pasien</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer Running Text (Marquee Announcement) */}
      <footer className="bg-slate-900 border-t border-slate-800 px-6 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-primary-600 text-white rounded-lg text-xs font-black uppercase tracking-wider flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5" /> INFORMASI
        </div>
        <div className="overflow-hidden whitespace-nowrap flex-1">
          <div className="inline-block animate-marquee text-sm font-semibold text-slate-300">
            {settings.runningText ||
              'Selamat datang di Klinik Pratama MediQ. Harap menjaga ketertiban, menyiapkan kartu identitas atau e-tiket QR code Anda.'}
          </div>
        </div>
      </footer>

      {/* Marquee Keyframe Style */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 25s linear infinite;
        }
      `}</style>
    </div>
  );
}

