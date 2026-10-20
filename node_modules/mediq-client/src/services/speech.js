/**
 * Layanan Audio Chime & Text-To-Speech (Web Speech API)
 * Didesain khusus untuk papan Smart TV Display Klinik MediQ
 */

// Sintesis Nada Panggilan (Ding-Dong Chime) menggunakan Web Audio API
export function playChime() {
  return new Promise((resolve) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        return resolve();
      }

      const ctx = new AudioContext();

      // Suara nada pertama (Ting: C5 - 523.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
      gain1.gain.setValueAtTime(0, ctx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.6);

      // Suara nada kedua (Dong: G4 - 392.00 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(392.00, ctx.currentTime + 0.35);
      gain2.gain.setValueAtTime(0, ctx.currentTime + 0.35);
      gain2.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.4);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.35);
      osc2.stop(ctx.currentTime + 1.2);

      setTimeout(() => {
        resolve();
      }, 1100);
    } catch (e) {
      console.warn('Audio chime tidak didukung:', e);
      resolve();
    }
  });
}

/**
 * Membaca teks dengan sintesis suara Bahasa Indonesia
 * Contoh: "Nomor antrean A-001, silakan menuju Poli Umum, Ruang 101."
 */
export async function announceQueue({
  ticketNumber,
  polyclinicName,
  roomNumber,
  doctorName,
  repeatCount = 1,
}) {
  if (!('speechSynthesis' in window)) {
    console.warn('Web Speech API tidak didukung pada browser ini.');
    return;
  }

  // Format pengucapan yang natural dalam bahasa Indonesia
  // Format nomor tiket: "A 0 0 1" dipisah per huruf/angka agar dieja jelas
  const formattedTicket = ticketNumber
    .split('')
    .map((char) => (char === '-' ? ' ' : `${char} `))
    .join('');

  const textToSpeak = `Nomor antrean ${formattedTicket}. Silakan menuju ${polyclinicName}, ${roomNumber}.`;

  // Mainkan lonceng pemanggil antrean terlebih dahulu
  await playChime();

  return new Promise((resolve) => {
    // Batalkan ucapan sebelumnya jika ada yang menumpuk
    window.speechSynthesis.cancel();

    // Dapatkan daftar suara yang tersedia
    const voices = window.speechSynthesis.getVoices();
    // Cari suara Bahasa Indonesia (id-ID)
    const indonesianVoice = voices.find(
      (v) => v.lang === 'id-ID' || v.lang === 'id_ID' || v.lang.startsWith('id')
    );

    let played = 0;

    function speakOnce() {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.9; // Kecepatan sedikit lambat agar artikulasi jelas
      utterance.pitch = 1.05;
      utterance.volume = 1.0;

      if (indonesianVoice) {
        utterance.voice = indonesianVoice;
      }

      utterance.onend = () => {
        played += 1;
        if (played < repeatCount) {
          setTimeout(speakOnce, 1200);
        } else {
          resolve();
        }
      };

      utterance.onerror = (e) => {
        console.error('Speech synthesis error:', e);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    }

    speakOnce();
  });
}

