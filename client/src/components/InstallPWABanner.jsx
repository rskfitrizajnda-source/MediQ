import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share } from 'lucide-react';

export default function InstallPWABanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Jangan tampilkan jika sudah dalam mode aplikasi terpasang (standalone)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      return;
    }

    // Cek apakah perangkat iOS (iPhone/iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Tangkap event instalasi browser (Chrome / Android / Edge)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Cek apakah user sebelumnya sudah menutup banner sesi ini
      const dismissed = sessionStorage.getItem('mediq_pwa_dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Untuk iOS, jika belum terpasang dan belum pernah ditutup, tampilkan panduan
    if (isIosDevice && !sessionStorage.getItem('mediq_pwa_dismissed')) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSGuide(false);
    sessionStorage.setItem('mediq_pwa_dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Banner Notifikasi Pasang Aplikasi */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-primary-100 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-500 flex items-center justify-center text-white shadow-md shadow-primary-500/20 shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 leading-tight">
              Gunakan MediQ di HP
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              Pasang ke layar utama untuk akses instan tanpa unduh file besar.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Pasang</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal Petunjuk untuk iPhone (Safari iOS) */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto">
              <Share className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Cara Pasang di iPhone (iOS)</h3>
            <ol className="text-xs text-slate-600 text-left space-y-2 list-decimal list-inside bg-slate-50 p-4 rounded-2xl">
              <li>Ketuk ikon <strong>Bagikan (Share)</strong> <span className="inline-block px-1 border rounded bg-white">⎋</span> di bagian bawah browser Safari.</li>
              <li>Gulir menu ke bawah lalu pilih <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.</li>
              <li>Ketuk <strong>Tambah (Add)</strong> di pojok kanan atas.</li>
            </ol>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}

