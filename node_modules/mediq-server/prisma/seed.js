const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding MediQ database...');

  // 1. Bersihkan data lama jika ada
  await prisma.queue.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.user.deleteMany();
  await prisma.polyclinic.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.clinicSetting.deleteMany();

  // 2. Hash password default
  const salt = await bcrypt.genSalt(10);
  const defaultPassword = await bcrypt.hash('password123', salt);

  // 3. Buat Setting Klinik
  await prisma.clinicSetting.create({
    data: {
      clinicName: 'Klinik Pratama MediQ Sehat',
      address: 'Jl. Kesehatan Medika No. 88, Menteng, Jakarta Pusat',
      phone: '(021) 8899-7722',
      runningText: 'Selamat datang di Klinik Pratama MediQ. Layanan Buka Senin - Sabtu 08.00 - 21.00 WIB. Jaga kesehatan bersama kami!',
      audioGreeting: 'Nomor antrean {ticket}, silakan menuju {polyclinic}, {room}.',
      autoCallRepeat: 2,
    },
  });

  // 4. Buat Akun Admin & Resepsionis
  await prisma.user.create({
    data: {
      name: 'Admin MediQ',
      email: 'admin@mediq.com',
      password: defaultPassword,
      role: 'ADMIN',
    },
  });

  await prisma.user.create({
    data: {
      name: 'Resepsionis Siti',
      email: 'resepsionis@mediq.com',
      password: defaultPassword,
      role: 'RECEPTIONIST',
    },
  });

  // 5. Buat Poliklinik
  const poliUmum = await prisma.polyclinic.create({
    data: {
      name: 'Poli Umum',
      code: 'A',
      description: 'Pemeriksaan kesehatan umum dan rujukan',
      color: '#2563eb', // Biru
    },
  });

  const poliGigi = await prisma.polyclinic.create({
    data: {
      name: 'Poli Gigi & Mulut',
      code: 'B',
      description: 'Perawatan kesehatan gigi, cabut gigi, dan pembersihan karang',
      color: '#059669', // Hijau
    },
  });

  const poliAnak = await prisma.polyclinic.create({
    data: {
      name: 'Poli Anak & Tumbuh Kembang',
      code: 'C',
      description: 'Konsultasi dokter spesialis anak dan imunisasi',
      color: '#d97706', // Oranye
    },
  });

  const poliKandungan = await prisma.polyclinic.create({
    data: {
      name: 'Poli Penyakit Dalam',
      code: 'D',
      description: 'Pemeriksaan organ dalam, metabolik, dan penyakit kronis',
      color: '#7c3aed', // Ungu
    },
  });

  // 6. Buat Akun Dokter & Profil Dokter
  const userDokter1 = await prisma.user.create({
    data: {
      name: 'dr. Andi Pratama',
      email: 'dokter.andi@mediq.com',
      password: defaultPassword,
      role: 'DOCTOR',
    },
  });

  const dokter1 = await prisma.doctor.create({
    data: {
      userId: userDokter1.id,
      polyclinicId: poliUmum.id,
      roomNumber: 'Ruang 101 (Lantai 1)',
      quotaPerDay: 40,
      avgConsultationMinutes: 10,
      isActive: true,
      scheduleDays: 'Senin,Selasa,Rabu,Kamis,Jumat,Sabtu',
      startTime: '08:00',
      endTime: '15:00',
    },
  });

  const userDokter2 = await prisma.user.create({
    data: {
      name: 'drg. Sarah Amanda',
      email: 'dokter.sarah@mediq.com',
      password: defaultPassword,
      role: 'DOCTOR',
    },
  });

  const dokter2 = await prisma.doctor.create({
    data: {
      userId: userDokter2.id,
      polyclinicId: poliGigi.id,
      roomNumber: 'Ruang 102 (Lantai 1)',
      quotaPerDay: 25,
      avgConsultationMinutes: 20,
      isActive: true,
      scheduleDays: 'Senin,Selasa,Rabu,Kamis,Jumat',
      startTime: '09:00',
      endTime: '16:00',
    },
  });

  const userDokter3 = await prisma.user.create({
    data: {
      name: 'dr. Budi Santoso, Sp.A',
      email: 'dokter.budi@mediq.com',
      password: defaultPassword,
      role: 'DOCTOR',
    },
  });

  const dokter3 = await prisma.doctor.create({
    data: {
      userId: userDokter3.id,
      polyclinicId: poliAnak.id,
      roomNumber: 'Ruang 201 (Lantai 2)',
      quotaPerDay: 30,
      avgConsultationMinutes: 15,
      isActive: true,
      scheduleDays: 'Senin,Rabu,Jumat',
      startTime: '08:30',
      endTime: '14:30',
    },
  });

  // 7. Buat Pasien Demo
  const pasien1 = await prisma.patient.create({
    data: {
      nik: '3171012304950001',
      name: 'Rian Hidayat',
      phone: '081234567890',
      email: 'rian.hidayat@gmail.com',
      address: 'Jl. Melati No. 12, Kebayoran Baru, Jakarta Selatan',
      gender: 'L',
      birthDate: new Date('1995-04-23'),
    },
  });

  const pasien2 = await prisma.patient.create({
    data: {
      nik: '3171016508980002',
      name: 'Dewi Lestari',
      phone: '081398765432',
      email: 'dewi.lestari@gmail.com',
      address: 'Jl. Kenanga No. 45, Cilandak, Jakarta Selatan',
      gender: 'P',
      birthDate: new Date('1998-08-15'),
    },
  });

  const pasien3 = await prisma.patient.create({
    data: {
      nik: '3171011111900003',
      name: 'Ahmad Fauzi',
      phone: '085712344321',
      email: 'fauzi.ahmad@gmail.com',
      address: 'Jl. Kemang Raya No. 8, Jakarta Selatan',
      gender: 'L',
      birthDate: new Date('1990-11-11'),
    },
  });

  const pasien4 = await prisma.patient.create({
    data: {
      nik: '3171010101850004',
      name: 'Citra Permata',
      phone: '082199887766',
      email: 'citra.permata@gmail.com',
      address: 'Jl. Tebet Barat No. 19, Jakarta Selatan',
      gender: 'P',
      birthDate: new Date('1985-01-01'),
    },
  });

  // 8. Riwayat Kunjungan Masa Lalu (Historical Medical Records) untuk Demo
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  // Riwayat 1: Rian Hidayat - Kunjungan 2 minggu lalu di Poli Umum
  await prisma.queue.create({
    data: {
      ticketNumber: 'A-008',
      bookingCode: 'MED-HIST-0001',
      sequenceNumber: 8,
      queueDate: twoWeeksAgo,
      status: 'COMPLETED',
      callCount: 1,
      complaint: 'Migrain dan pusing berputar selama 2 hari',
      diagnosisNotes: 'Diagnosis: Tension Headache akut. Resep: Paracetamol 500mg (3x1 tab sesudah makan), Vitamin B-Complex (1x1 tab). Pasien dianjurkan cukup tidur dan kurangi konsumsi kafein.',
      checkInTime: new Date(twoWeeksAgo.getTime() + 10 * 60 * 1000),
      calledTime: new Date(twoWeeksAgo.getTime() + 25 * 60 * 1000),
      startTime: new Date(twoWeeksAgo.getTime() + 27 * 60 * 1000),
      endTime: new Date(twoWeeksAgo.getTime() + 38 * 60 * 1000),
      patientId: pasien1.id,
      doctorId: dokter1.id,
      polyclinicId: poliUmum.id,
    },
  });

  // Riwayat 2: Dewi Lestari - Kunjungan 1 minggu lalu di Poli Gigi
  await prisma.queue.create({
    data: {
      ticketNumber: 'B-004',
      bookingCode: 'MED-HIST-0002',
      sequenceNumber: 4,
      queueDate: oneWeekAgo,
      status: 'COMPLETED',
      callCount: 1,
      complaint: 'Pembersihan karang gigi dan gusi berdarah',
      diagnosisNotes: 'Diagnosis: Gingivitis marginalis kronis & Calculus gigi rahang bawah. Tindakan: Scaling karang gigi selesai. Resep: Obat kumur Chlorhexidine 0.2% 2x sehari, Asam Mefenamat 500mg jika nyeri.',
      checkInTime: new Date(oneWeekAgo.getTime() + 15 * 60 * 1000),
      calledTime: new Date(oneWeekAgo.getTime() + 30 * 60 * 1000),
      startTime: new Date(oneWeekAgo.getTime() + 32 * 60 * 1000),
      endTime: new Date(oneWeekAgo.getTime() + 55 * 60 * 1000),
      patientId: pasien2.id,
      doctorId: dokter2.id,
      polyclinicId: poliGigi.id,
    },
  });

  // Riwayat 3: Ahmad Fauzi - Kunjungan 3 hari lalu di Poli Umum
  await prisma.queue.create({
    data: {
      ticketNumber: 'A-012',
      bookingCode: 'MED-HIST-0003',
      sequenceNumber: 12,
      queueDate: threeDaysAgo,
      status: 'COMPLETED',
      callCount: 1,
      complaint: 'Batuk berdahak dan hidung tersumbat',
      diagnosisNotes: 'Diagnosis: ISPA (Infeksi Saluran Pernapasan Akut). Resep: Ambroxol 30mg (3x1 tab), Cetirizine 10mg (1x1 tab malam). Istirahat 3 hari.',
      checkInTime: new Date(threeDaysAgo.getTime() + 20 * 60 * 1000),
      calledTime: new Date(threeDaysAgo.getTime() + 40 * 60 * 1000),
      startTime: new Date(threeDaysAgo.getTime() + 42 * 60 * 1000),
      endTime: new Date(threeDaysAgo.getTime() + 52 * 60 * 1000),
      patientId: pasien3.id,
      doctorId: dokter1.id,
      polyclinicId: poliUmum.id,
    },
  });

  // 9. Buat Antrean Contoh untuk Hari Ini
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // A-001 (IN_CONSULTATION)
  await prisma.queue.create({
    data: {
      ticketNumber: 'A-001',
      bookingCode: 'MED-20261008-0001',
      sequenceNumber: 1,
      queueDate: today,
      status: 'IN_CONSULTATION',
      callCount: 1,
      complaint: 'Demam tinggi 3 hari dan batuk berdahak',
      checkInTime: new Date(Date.now() - 35 * 60 * 1000),
      calledTime: new Date(Date.now() - 10 * 60 * 1000),
      startTime: new Date(Date.now() - 8 * 60 * 1000),
      patientId: pasien1.id,
      doctorId: dokter1.id,
      polyclinicId: poliUmum.id,
    },
  });

  // A-002 (CHECKED_IN - Siap dipanggil berikutnya)
  await prisma.queue.create({
    data: {
      ticketNumber: 'A-002',
      bookingCode: 'MED-20261008-0002',
      sequenceNumber: 2,
      queueDate: today,
      status: 'CHECKED_IN',
      callCount: 0,
      complaint: 'Flu berat dan sakit tenggorokan',
      checkInTime: new Date(Date.now() - 20 * 60 * 1000),
      estimatedTime: new Date(Date.now() + 5 * 60 * 1000),
      patientId: pasien2.id,
      doctorId: dokter1.id,
      polyclinicId: poliUmum.id,
    },
  });

  // A-003 (PENDING - Belum scan di klinik)
  await prisma.queue.create({
    data: {
      ticketNumber: 'A-003',
      bookingCode: 'MED-20261008-0003',
      sequenceNumber: 3,
      queueDate: today,
      status: 'PENDING',
      callCount: 0,
      complaint: 'Check-up rutin tekanan darah',
      estimatedTime: new Date(Date.now() + 25 * 60 * 1000),
      patientId: pasien3.id,
      doctorId: dokter1.id,
      polyclinicId: poliUmum.id,
    },
  });

  // B-001 (CHECKED_IN - Poli Gigi)
  await prisma.queue.create({
    data: {
      ticketNumber: 'B-001',
      bookingCode: 'MED-20261008-0004',
      sequenceNumber: 1,
      queueDate: today,
      status: 'CHECKED_IN',
      callCount: 0,
      complaint: 'Sakit gigi geraham belakang bengkak',
      checkInTime: new Date(Date.now() - 15 * 60 * 1000),
      estimatedTime: new Date(Date.now() + 10 * 60 * 1000),
      patientId: pasien4.id,
      doctorId: dokter2.id,
      polyclinicId: poliGigi.id,
    },
  });

  console.log('Seeding selesai dengan sukses!');
  console.log('User Demo:');
  console.log('- Admin: admin@mediq.com / password123');
  console.log('- Resepsionis: resepsionis@mediq.com / password123');
  console.log('- Dokter 1: dokter.andi@mediq.com / password123');
  console.log('- Dokter 2: dokter.sarah@mediq.com / password123');
}

main()
  .catch((e) => {
    console.error('Error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
