# MediQ

MediQ adalah aplikasi manajemen antrean klinik dengan frontend React/Vite, backend Express + Socket.IO, dan PostgreSQL melalui Prisma.

## Pasang MediQ seperti aplikasi Android (PWA)

Frontend MediQ telah dikonfigurasi agar dapat dipasang dari Chrome Android ke layar utama dan dibuka dalam mode aplikasi tanpa address bar. Pengguna tidak perlu mengunduh APK untuk cara ini.

### Pemasangan melalui URL HTTPS (direkomendasikan untuk penggunaan nyata)

1. Deploy backend dan frontend mengikuti bagian **Deployment** di bawah.
2. Buka URL HTTPS frontend MediQ di Chrome pada HP Android.
3. Buka menu Chrome (⋮), pilih **Install app / Pasang aplikasi**. Jika yang muncul **Add to Home screen / Tambahkan ke layar utama**, pilih opsi itu.
4. Ketuk ikon MediQ yang muncul di layar utama. API dan fitur antrean realtime tetap membutuhkan koneksi internet serta backend yang aktif.

### Uji pada HP Android yang tersambung melalui USB ke komputer

Persyaratan: Node.js, ADB/Android Platform Tools, dan USB debugging yang sudah disetujui di HP.

1. Di komputer, jalankan backend dan frontend sesuai petunjuk **Jalankan secara lokal**.
2. Di PowerShell kedua, pastikan HP terdeteksi:

   ```powershell
   adb devices
   ```

   Status perangkat harus `device`, bukan `unauthorized`.

3. Teruskan port pengembangan ke HP:

   ```powershell
   adb reverse tcp:5173 tcp:5173
   adb reverse tcp:5000 tcp:5000
   ```

4. Buka Chrome di HP dan kunjungi `http://localhost:5173`. Di menu Chrome, pilih **Install app / Pasang aplikasi** atau **Add to Home screen / Tambahkan ke layar utama**. Jika opsi instalasi belum muncul, muat ulang halaman dan pastikan file manifest serta service worker berhasil dimuat.
5. Untuk uji USB, komputer dan kedua server harus tetap menyala dan port forwarding masih aktif. Ini bukan rilis publik; gunakan URL HTTPS setelah deployment.

PWA bukan proyek Flutter, sehingga tidak dijalankan dengan `flutter run`. Untuk paket APK native, proyek Android/Capacitor perlu dibuat dan dibangun terpisah.

## Build APK Android

APK MediQ adalah aplikasi Android yang membungkus frontend; backend Express dan database PostgreSQL tetap harus aktif dan bisa diakses HP. Siapkan URL backend HTTPS terlebih dahulu sesuai bagian **Deployment**, lalu pada komputer Windows pasang Node.js 22+ (Capacitor 8), Android Studio dengan Android SDK Platform 36, dan JDK 17+.

1. Dari folder `client`, buat file `.env.local` berisi URL backend publik (tanpa akhiran `/api`):

   ```dotenv
   VITE_API_URL=https://alamat-backend-anda
   VITE_SOCKET_URL=https://alamat-backend-anda
   ```

2. Dari folder root repository, instal dependensi bila belum:

   ```powershell
   npm install
   ```

3. Buat proyek Android native satu kali:

   ```powershell
   cd client
   npm run android:add
   ```

4. Setiap kali frontend atau URL backend berubah, sinkronkan aset:

   ```powershell
   npm run android:sync
   ```

5. Build APK debug dari PowerShell:

   ```powershell
   cd android
   .\gradlew.bat assembleDebug
   ```

   APK tersedia di `client/android/app/build/outputs/apk/debug/app-debug.apk`. Salin APK ke HP Android dan izinkan pemasangan dari sumber tersebut. Untuk distribusi publik, buat signed release APK/AAB melalui Android Studio; jangan membagikan debug APK sebagai rilis produksi.

Build APK membutuhkan Android SDK dan JDK yang didukung Android Gradle Plugin. APK hanya dapat mengakses backend yang dijangkau HP; gunakan HTTPS untuk deployment, bukan alamat `localhost` komputer.

## Persiapan keamanan sebelum rilis

**Jangan gunakan kredensial yang pernah tersimpan di repository publik.** File environment yang ada di versi terbaru sudah dihapus, tetapi penghapusan file tidak menghilangkan isinya dari riwayat Git.

1. Reset password database PostgreSQL/Supabase yang pernah digunakan dan perbarui nilai `DATABASE_URL` di layanan deployment. Jangan masukkan URL database atau password ke Git.
2. Buat `JWT_SECRET` acak baru dengan minimal 32 karakter dan simpan hanya di environment backend. Contoh pembuat secret lokal: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.
3. Periksa kebijakan akses database/RLS dan pastikan aplikasi belum menyimpan data pasien nyata sebelum pengujian keamanan selesai.
4. Untuk membersihkan file rahasia dari riwayat Git lama, ikuti panduan GitHub tentang penghapusan data sensitif setelah credential dirotasi. Jangan hanya force-push tanpa menyiapkan backup dan koordinasi dengan pengguna repository.

## Jalankan secara lokal

Persyaratan: Node.js 20 atau lebih baru dan PostgreSQL.

1. Salin `server/.env.example` menjadi `server/.env`, lalu isi `DATABASE_URL` untuk database lokal dan buat `JWT_SECRET` acak.
2. Instal dependensi dari direktori root:

   ```bash
   npm install
   npm --prefix server run prisma:generate
   ```

3. Siapkan skema database lokal:

   ```bash
   npm --prefix server run prisma:push
   ```

4. Jalankan frontend dan backend:

   ```bash
   npm run dev
   ```

Frontend lokal: http://localhost:5173  
Health check backend: http://localhost:5000/api/health

## Deployment yang disarankan

MediQ membutuhkan backend yang tetap berjalan dan database PostgreSQL. Deploy frontend dan backend sebagai dua layanan terpisah. Repository ini menyertakan `render.yaml` untuk konfigurasi awal backend Render dan `client/vercel.json` untuk routing single-page app di Vercel.

### 1. Backend API — Render

1. Buat **Web Service** dari repository GitHub ini dan gunakan branch `main`.
2. Atur build command ke `npm install && npm --prefix server run prisma:generate`.
3. Atur start command ke `npm --prefix server start` dan health check path ke `/api/health`.
4. Tambahkan environment variable:
   - `NODE_ENV=production`
   - `DATABASE_URL`: connection string PostgreSQL yang baru, setelah password database dirotasi.
   - `JWT_SECRET`: secret acak baru, minimal 32 karakter.
   - `CLIENT_URL`: domain frontend Vercel yang diizinkan, misalnya `https://nama-proyek.vercel.app`. Beberapa domain dapat dipisahkan dengan koma.
5. Setelah backend aktif, buka `https://alamat-backend/api/health`. Hasil yang diharapkan memuat `"status":"UP"`.

### 2. Frontend — Vercel

1. Impor repository ini di Vercel dan pilih **Root Directory** `client`.
2. Gunakan build command `npm run build` dan output directory `dist`.
3. Tambahkan environment variable `VITE_API_URL` dengan origin backend Render lengkap, tanpa akhiran `/api`, misalnya `https://nama-layanan.onrender.com`.
4. Secara opsional, set `VITE_SOCKET_URL` ke origin backend yang sama. Jika dikosongkan, aplikasi memakai `VITE_API_URL`.
5. Deploy. Setelah alamat Vercel diketahui, pastikan `CLIENT_URL` pada Render cocok persis dengan origin frontend (termasuk `https://`), lalu redeploy backend bila perlu.

### 3. Database

Pastikan database Supabase/PostgreSQL siap dan backup tersedia sebelum mengubah skema. Untuk database baru, jalankan `npm --prefix server run prisma:push` satu kali dari lingkungan yang memiliki `DATABASE_URL` benar. Untuk database yang sudah berisi data, tinjau perubahan skema dan buat backup sebelum menjalankan perintah yang mengubah database. Jangan jalankan seeding data contoh di database produksi tanpa meninjau `server/prisma/seed.js`.

## Environment variables

- Backend: `PORT` (disediakan host), `NODE_ENV`, `CLIENT_URL`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`.
- Frontend build: `VITE_API_URL` dan opsional `VITE_SOCKET_URL`.
- Jangan pernah menambahkan file `.env` atau kredensial layanan ke Git. Template yang aman tersedia pada file `.env.example`.

## Pemeriksaan sebelum membagikan aplikasi

- Uji login untuk setiap peran, booking pasien, check-in QR, antrean realtime, dashboard dokter/admin, dan layar TV.
- Pastikan tidak memakai data pasien sungguhan untuk demo, kecuali keamanan, akses dan kewajiban privasinya telah diperiksa.
- Verifikasi health check, CORS, WebSocket, pengaturan password, backup database, dan kebijakan akses sebelum mengundang pengguna publik.
