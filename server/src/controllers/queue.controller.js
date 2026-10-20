const prisma = require('../lib/prisma');
const queueService = require('../services/queue.service');
const etaService = require('../services/eta.service');
const { emitQueueCalled, emitQueueUpdate } = require('../sockets/queue.socket');

/**
 * Ambil Seluruh Antrean Hari Ini dengan Filter
 */
async function getTodayQueues(req, res, next) {
  try {
    const { polyclinicId, doctorId, status, search } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where = {
      queueDate: {
        gte: today,
        lt: tomorrow,
      },
    };

    if (polyclinicId) where.polyclinicId = polyclinicId;
    if (doctorId) where.doctorId = doctorId;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { bookingCode: { contains: search, mode: 'insensitive' } },
        { patient: { name: { contains: search, mode: 'insensitive' } } },
        { patient: { nik: { contains: search } } },
      ];
    }

    const queues = await prisma.queue.findMany({
      where,
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
      orderBy: [
        { sequenceNumber: 'asc' },
      ],
    });

    res.json({
      success: true,
      count: queues.length,
      data: queues,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Check-in Scanner Resepsionis / Pasien Scan QR di Kios
 */
async function checkIn(req, res, next) {
  try {
    const { bookingCode } = req.body;

    if (!bookingCode) {
      return res.status(400).json({
        success: false,
        message: 'Kode booking harus disediakan.',
      });
    }

    const result = await queueService.checkInByBookingCode(bookingCode.trim());

    // Emit event socket untuk real-time update
    emitQueueUpdate(result.queue, 'CHECK_IN');

    res.json({
      success: true,
      alreadyCheckedIn: result.alreadyCheckedIn,
      message: result.message,
      data: result.queue,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Dokter Memanggil Pasien (Panggil)
 */
async function call(req, res, next) {
  try {
    const { queueId } = req.params;

    const queue = await queueService.callPatient(queueId);

    // Kirim notifikasi socket ke Smart TV & Pasien
    emitQueueCalled(queue);
    emitQueueUpdate(queue, 'CALL');

    res.json({
      success: true,
      message: `Pasien ${queue.patient.name} (${queue.ticketNumber}) berhasil dipanggil.`,
      data: queue,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Dokter Memanggil Ulang Pasien (Panggil Ulang / Recall)
 */
async function recall(req, res, next) {
  try {
    const { queueId } = req.params;

    const queue = await queueService.recallPatient(queueId);

    // Kirim sinyal panggil ulang ke Smart TV
    emitQueueCalled(queue);
    emitQueueUpdate(queue, 'RECALL');

    res.json({
      success: true,
      message: `Panggilan ulang untuk nomor ${queue.ticketNumber} berhasil disiarkan.`,
      data: queue,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Dokter Memulai Pemeriksaan / Konsultasi
 */
async function start(req, res, next) {
  try {
    const { queueId } = req.params;

    const queue = await queueService.startConsultation(queueId);

    emitQueueUpdate(queue, 'START_CONSULTATION');

    res.json({
      success: true,
      message: `Pemeriksaan untuk ${queue.patient.name} telah dimulai.`,
      data: queue,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Dokter Menyelesaikan Pemeriksaan
 */
async function finish(req, res, next) {
  try {
    const { queueId } = req.params;
    const { diagnosisNotes } = req.body;

    const queue = await queueService.finishConsultation(queueId, diagnosisNotes);

    emitQueueUpdate(queue, 'FINISH_CONSULTATION');

    res.json({
      success: true,
      message: `Pemeriksaan selesai untuk ${queue.patient.name}.`,
      data: queue,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Dokter Melewati Pasien yang tidak datang
 */
async function skip(req, res, next) {
  try {
    const { queueId } = req.params;

    const queue = await queueService.skipPatient(queueId);

    emitQueueUpdate(queue, 'SKIP');

    res.json({
      success: true,
      message: `Antrean ${queue.ticketNumber} telah dilewati.`,
      data: queue,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Pendaftaran Walk-in oleh Resepsionis
 */
async function walkInRegister(req, res, next) {
  try {
    const { nik, name, phone, email, address, gender, doctorId, polyclinicId, complaint } = req.body;

    if (!nik || !name || !phone || !doctorId || !polyclinicId) {
      return res.status(400).json({
        success: false,
        message: 'NIK, Nama, Nomor Telepon, Dokter, dan Poliklinik wajib diisi.',
      });
    }

    const result = await queueService.registerWalkIn({
      nik,
      name,
      phone,
      email,
      address,
      gender,
      doctorId,
      polyclinicId,
      complaint,
    });

    emitQueueUpdate(result.queue, 'NEW_WALK_IN');

    res.status(201).json({
      success: true,
      message: `Pendaftaran walk-in berhasil. Nomor tiket: ${result.queue.ticketNumber}`,
      data: result.queue,
      qrCodeUrl: result.qrCodeUrl,
      eta: result.eta,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Ambil Data untuk Smart TV Display Papan Antrean Real-Time
 */
async function getTvDisplayData(req, res, next) {
  try {
    const data = await queueService.getLiveTvDisplayData();
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lacak Antrean (Oleh Pasien melalui Nomor Tiket atau Kode Booking)
 */
async function trackQueue(req, res, next) {
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Kode tiket atau kode booking harus diisi.',
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const queue = await prisma.queue.findFirst({
      where: {
        OR: [
          { bookingCode: code.toUpperCase().trim() },
          { ticketNumber: code.toUpperCase().trim() },
        ],
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

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: `Antrean dengan kode "${code}" tidak ditemukan.`,
      });
    }

    // Kalkulasi Dynamic ETA terkini
    const eta = await etaService.calculateQueueEta(queue.id);
    const qrCodeUrl = await queueService.generateQRCode(queue.bookingCode);

    res.json({
      success: true,
      data: {
        ...queue,
        eta,
        qrCodeUrl,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTodayQueues,
  checkIn,
  call,
  recall,
  start,
  finish,
  skip,
  walkInRegister,
  getTvDisplayData,
  trackQueue,
};

