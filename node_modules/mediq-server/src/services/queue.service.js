const prisma = require('../lib/prisma');
const qrcode = require('qrcode');
const etaService = require('./eta.service');

class QueueService {
  /**
   * Menghasilkan Booking Code unik format: MED-YYYYMMDD-XXXX
   */
  generateBookingCode() {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `MED-${dateStr}-${randomHex}`;
  }

  /**
   * Menghasilkan Data URL gambar QR Code dari booking code
   */
  async generateQRCode(bookingCode) {
    try {
      return await qrcode.toDataURL(bookingCode, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 300,
        color: {
          dark: '#1e293b',
          light: '#ffffff',
        },
      });
    } catch (err) {
      console.error('Error generating QR code:', err);
      return null;
    }
  }

  /**
   * Ambil nomor urut berikutnya untuk Poliklinik & Tanggal tertentu
   */
  async getNextSequence(polyclinicId, queueDate) {
    const startOfDay = new Date(queueDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(queueDate);
    endOfDay.setHours(23, 59, 59, 999);

    const count = await prisma.queue.count({
      where: {
        polyclinicId,
        queueDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    return count + 1;
  }

  /**
   * Pendaftaran Mandiri Pasien (Online Booking)
   */
  async bookQueue({ nik, name, phone, email, address, gender, birthDate, doctorId, polyclinicId, queueDate, complaint }) {
    const targetDate = new Date(queueDate);
    targetDate.setHours(0, 0, 0, 0);

    // Cek kuota dokter hari itu
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { polyclinic: true },
    });

    if (!doctor || !doctor.isActive) {
      throw new Error('Dokter yang dipilih tidak aktif atau tidak ditemukan.');
    }

    const currentBookedCount = await prisma.queue.count({
      where: {
        doctorId,
        queueDate: targetDate,
        status: { notIn: ['CANCELLED'] },
      },
    });

    if (currentBookedCount >= doctor.quotaPerDay) {
      throw new Error(`Kuota dokter ${doctor.user ? doctor.user.name : ''} untuk tanggal ini sudah penuh (Maks: ${doctor.quotaPerDay}).`);
    }

    // Upsert Patient berdasarkan NIK
    let patient = await prisma.patient.findUnique({ where: { nik } });
    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          nik,
          name,
          phone,
          email,
          address,
          gender: gender || 'L',
          birthDate: birthDate ? new Date(birthDate) : null,
        },
      });
    } else {
      // Update data terbaru jika ada perubahan kontak
      patient = await prisma.patient.update({
        where: { id: patient.id },
        data: { name, phone, email: email || patient.email, address: address || patient.address },
      });
    }

    // Cek apakah pasien sudah memiliki antrean aktif di hari yang sama untuk poli yang sama
    const existingActiveQueue = await prisma.queue.findFirst({
      where: {
        patientId: patient.id,
        polyclinicId,
        queueDate: targetDate,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
    });

    if (existingActiveQueue) {
      throw new Error(`Pasien sudah memiliki tiket aktif (${existingActiveQueue.ticketNumber}) di poliklinik ini untuk tanggal tersebut.`);
    }

    // Ambil nomor urut dan bentuk nomor tiket (misal A-001)
    const sequenceNumber = await this.getNextSequence(polyclinicId, targetDate);
    const prefixCode = doctor.polyclinic.code || 'A';
    const ticketNumber = `${prefixCode}-${String(sequenceNumber).padStart(3, '0')}`;
    const bookingCode = this.generateBookingCode();

    // Buat record antrean
    const newQueue = await prisma.queue.create({
      data: {
        ticketNumber,
        bookingCode,
        sequenceNumber,
        queueDate: targetDate,
        status: 'PENDING',
        complaint: complaint || 'Pemeriksaan umum',
        patientId: patient.id,
        doctorId,
        polyclinicId,
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: { select: { name: true, email: true } },
            polyclinic: true,
          },
        },
        polyclinic: true,
      },
    });

    // Hitung ETA awal
    const etaData = await etaService.calculateQueueEta(newQueue.id);
    const updatedQueue = await prisma.queue.update({
      where: { id: newQueue.id },
      data: { estimatedTime: etaData.estimatedTime },
      include: {
        patient: true,
        doctor: {
          include: {
            user: { select: { name: true, email: true } },
            polyclinic: true,
          },
        },
        polyclinic: true,
      },
    });

    const qrCodeUrl = await this.generateQRCode(bookingCode);

    return {
      queue: updatedQueue,
      qrCodeUrl,
      eta: etaData,
    };
  }

  /**
   * Pendaftaran Walk-in Pasien di Meja Resepsionis (Langsung CHECKED_IN)
   */
  async registerWalkIn({ nik, name, phone, email, address, gender, doctorId, polyclinicId, complaint }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { polyclinic: true },
    });

    if (!doctor) {
      throw new Error('Dokter tidak ditemukan.');
    }

    // Upsert Patient
    let patient = await prisma.patient.findUnique({ where: { nik } });
    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          nik,
          name,
          phone,
          email,
          address,
          gender: gender || 'L',
        },
      });
    } else {
      patient = await prisma.patient.update({
        where: { id: patient.id },
        data: { name, phone, email: email || patient.email, address: address || patient.address },
      });
    }

    const sequenceNumber = await this.getNextSequence(polyclinicId, today);
    const prefixCode = doctor.polyclinic.code || 'A';
    const ticketNumber = `${prefixCode}-${String(sequenceNumber).padStart(3, '0')}`;
    const bookingCode = this.generateBookingCode();

    const newQueue = await prisma.queue.create({
      data: {
        ticketNumber,
        bookingCode,
        sequenceNumber,
        queueDate: today,
        status: 'CHECKED_IN', // Walk-in otomatis langsung checked in karena pasien sudah ada di klinik
        checkInTime: new Date(),
        complaint: complaint || 'Walk-in Konsultasi',
        patientId: patient.id,
        doctorId,
        polyclinicId,
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: { select: { name: true, email: true } },
            polyclinic: true,
          },
        },
        polyclinic: true,
      },
    });

    const etaData = await etaService.calculateQueueEta(newQueue.id);
    const updatedQueue = await prisma.queue.update({
      where: { id: newQueue.id },
      data: { estimatedTime: etaData.estimatedTime },
      include: {
        patient: true,
        doctor: {
          include: {
            user: { select: { name: true, email: true } },
            polyclinic: true,
          },
        },
        polyclinic: true,
      },
    });

    const qrCodeUrl = await this.generateQRCode(bookingCode);

    return {
      queue: updatedQueue,
      qrCodeUrl,
      eta: etaData,
    };
  }

  /**
   * Check-in QR Scanner Resepsionis
   */
  async checkInByBookingCode(bookingCode) {
    const queue = await prisma.queue.findUnique({
      where: { bookingCode },
      include: {
        patient: true,
        doctor: {
          include: {
            user: { select: { name: true } },
            polyclinic: true,
          },
        },
        polyclinic: true,
      },
    });

    if (!queue) {
      throw new Error(`Kode booking "${bookingCode}" tidak ditemukan.`);
    }

    if (queue.status !== 'PENDING') {
      return {
        alreadyCheckedIn: true,
        message: `Tiket ${queue.ticketNumber} sudah berstatus ${queue.status}.`,
        queue,
      };
    }

    const updated = await prisma.queue.update({
      where: { id: queue.id },
      data: {
        status: 'CHECKED_IN',
        checkInTime: new Date(),
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: { select: { name: true } },
            polyclinic: true,
          },
        },
        polyclinic: true,
      },
    });

    // Update ETA untuk antrean dokter tersebut
    await etaService.updateDoctorQueuesEta(queue.doctorId);

    return {
      alreadyCheckedIn: false,
      message: `Check-in berhasil untuk ${queue.patient.name} (${queue.ticketNumber}).`,
      queue: updated,
    };
  }

  /**
   * Dokter Memanggil Pasien (Panggil)
   */
  async callPatient(queueId) {
    const queue = await prisma.queue.findUnique({
      where: { id: queueId },
      include: {
        patient: true,
        doctor: {
          include: {
            user: { select: { name: true } },
            polyclinic: true,
          },
        },
        polyclinic: true,
      },
    });

    if (!queue) {
      throw new Error('Data antrean tidak ditemukan.');
    }

    const updated = await prisma.queue.update({
      where: { id: queueId },
      data: {
        status: 'CALLING',
        callCount: queue.callCount + 1,
        calledTime: new Date(),
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: { select: { name: true } },
            polyclinic: true,
          },
        },
        polyclinic: true,
      },
    });

    return updated;
  }

  /**
   * Dokter Memanggil Ulang Pasien (Panggil Ulang / Recall)
   */
  async recallPatient(queueId) {
    const queue = await prisma.queue.findUnique({
      where: { id: queueId },
      include: {
        patient: true,
        doctor: {
          include: {
            user: { select: { name: true } },
            polyclinic: true,
          },
        },
        polyclinic: true,
      },
    });

    if (!queue) {
      throw new Error('Data antrean tidak ditemukan.');
    }

    const updated = await prisma.queue.update({
      where: { id: queueId },
      data: {
        status: 'CALLING',
        callCount: queue.callCount + 1,
        calledTime: new Date(),
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: { select: { name: true } },
            polyclinic: true,
          },
        },
        polyclinic: true,
      },
    });

    return updated;
  }

  /**
   * Dokter Memulai Konsultasi (Mulai)
   */
  async startConsultation(queueId) {
    const queue = await prisma.queue.findUnique({ where: { id: queueId } });
    if (!queue) throw new Error('Data antrean tidak ditemukan.');

    const updated = await prisma.queue.update({
      where: { id: queueId },
      data: {
        status: 'IN_CONSULTATION',
        startTime: new Date(),
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: { select: { name: true } },
            polyclinic: true,
          },
        },
        polyclinic: true,
      },
    });

    // Update ETA untuk pasien selanjutnya
    await etaService.updateDoctorQueuesEta(queue.doctorId);

    return updated;
  }

  /**
   * Dokter Menyelesaikan Konsultasi (Selesai)
   */
  async finishConsultation(queueId, diagnosisNotes) {
    const queue = await prisma.queue.findUnique({ where: { id: queueId } });
    if (!queue) throw new Error('Data antrean tidak ditemukan.');

    const updated = await prisma.queue.update({
      where: { id: queueId },
      data: {
        status: 'COMPLETED',
        endTime: new Date(),
        diagnosisNotes: diagnosisNotes || queue.diagnosisNotes,
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: { select: { name: true } },
            polyclinic: true,
          },
        },
        polyclinic: true,
      },
    });

    // Recalculate moving average durasi dan perbarui ETA antrean berikutnya
    await etaService.updateDoctorQueuesEta(queue.doctorId);

    return updated;
  }

  /**
   * Dokter Melewati Pasien jika tidak hadir (Lewati)
   */
  async skipPatient(queueId) {
    const queue = await prisma.queue.findUnique({ where: { id: queueId } });
    if (!queue) throw new Error('Data antrean tidak ditemukan.');

    const updated = await prisma.queue.update({
      where: { id: queueId },
      data: {
        status: 'SKIPPED',
        endTime: new Date(),
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: { select: { name: true } },
            polyclinic: true,
          },
        },
        polyclinic: true,
      },
    });

    await etaService.updateDoctorQueuesEta(queue.doctorId);

    return updated;
  }

  /**
   * Ambil Status Live Antrean Seluruh Poliklinik untuk Smart TV Display
   */
  async getLiveTvDisplayData() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const polyclinics = await prisma.polyclinic.findMany({
      include: {
        doctors: {
          where: { isActive: true },
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    const displayData = [];

    for (const poly of polyclinics) {
      // Ambil pasien yang sedang dipanggil atau sedang konsultasi
      const activeQueue = await prisma.queue.findFirst({
        where: {
          polyclinicId: poly.id,
          queueDate: { gte: today, lt: tomorrow },
          status: { in: ['CALLING', 'IN_CONSULTATION'] },
        },
        include: {
          patient: { select: { name: true } },
          doctor: {
            include: {
              user: { select: { name: true } },
            },
          },
        },
        orderBy: { calledTime: 'desc' },
      });

      // Ambil antrean berikutnya yang menunggu (CHECKED_IN)
      const nextQueue = await prisma.queue.findFirst({
        where: {
          polyclinicId: poly.id,
          queueDate: { gte: today, lt: tomorrow },
          status: 'CHECKED_IN',
        },
        include: {
          patient: { select: { name: true } },
        },
        orderBy: { sequenceNumber: 'asc' },
      });

      // Total antrean hari ini
      const totalCount = await prisma.queue.count({
        where: {
          polyclinicId: poly.id,
          queueDate: { gte: today, lt: tomorrow },
          status: { notIn: ['CANCELLED'] },
        },
      });

      // Total selesai
      const completedCount = await prisma.queue.count({
        where: {
          polyclinicId: poly.id,
          queueDate: { gte: today, lt: tomorrow },
          status: 'COMPLETED',
        },
      });

      // Total menunggu
      const waitingCount = await prisma.queue.count({
        where: {
          polyclinicId: poly.id,
          queueDate: { gte: today, lt: tomorrow },
          status: { in: ['CHECKED_IN', 'PENDING'] },
        },
      });

      displayData.push({
        polyclinic: {
          id: poly.id,
          name: poly.name,
          code: poly.code,
          color: poly.color,
          description: poly.description,
        },
        currentCalling: activeQueue
          ? {
              ticketNumber: activeQueue.ticketNumber,
              patientName: activeQueue.patient.name,
              doctorName: activeQueue.doctor?.user?.name || 'Dokter Jaga',
              roomNumber: activeQueue.doctor?.roomNumber || 'Ruang Periksa',
              status: activeQueue.status,
              callCount: activeQueue.callCount,
              calledTime: activeQueue.calledTime,
            }
          : null,
        nextTicket: nextQueue ? nextQueue.ticketNumber : '-',
        totalToday: totalCount,
        completedToday: completedCount,
        waitingCount,
      });
    }

    const settings = await prisma.clinicSetting.findFirst();

    return {
      polyclinics: displayData,
      settings: settings || {
        clinicName: 'Klinik Pratama MediQ',
        runningText: 'Selamat datang di Klinik Pratama MediQ. Antrean berjalan real-time.',
      },
      updatedAt: new Date(),
    };
  }
}

module.exports = new QueueService();

