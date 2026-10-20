import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, AlertCircle, Keyboard } from 'lucide-react';
import Modal from './Modal';

export default function QRScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    let html5QrCode = null;

    if (isOpen) {
      setCameraError(null);
      const scannerElementId = 'qr-reader-container';

      // Beri sedikit jeda agar elemen DOM ter-render
      const timer = setTimeout(() => {
        try {
          html5QrCode = new Html5Qrcode(scannerElementId);
          scannerRef.current = html5QrCode;

          const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          };

          html5QrCode
            .start(
              { facingMode: 'environment' },
              config,
              (decodedText) => {
                // Berhasil scan!
                html5QrCode.stop().then(() => {
                  setIsScanning(false);
                  onScanSuccess(decodedText);
                  onClose();
                });
              },
              (errorMessage) => {
                // Parse error biasa saat frame belum menemukan QR
              }
            )
            .then(() => {
              setIsScanning(true);
            })
            .catch((err) => {
              console.warn('Gagal membuka kamera:', err);
              setCameraError('Kamera tidak dapat diakses atau izin ditolak. Silakan masukkan kode secara manual.');
            });
        } catch (e) {
          setCameraError('Inisialisasi kamera gagal.');
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current && scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {});
        }
      };
    }
  }, [isOpen]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
      onScanSuccess(manualCode.trim());
      setManualCode('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scan QR Code Check-in Pasien">
      <div className="space-y-4">
        {/* Kontainer Kamera Scanner */}
        <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-700 min-h-[260px] flex flex-col items-center justify-center text-white">
          <div id="qr-reader-container" className="w-full h-full max-w-[320px]"></div>

          {cameraError && (
            <div className="p-4 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="text-sm text-slate-300">{cameraError}</p>
            </div>
          )}
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            atau masukkan manual
          </span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* Input Manual Kode Booking */}
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <label className="block text-xs font-semibold text-slate-600">
            Kode Booking (Contoh: MED-20261008-0001)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="MED-..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono uppercase"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Keyboard className="w-4 h-4" />
              Proses
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

