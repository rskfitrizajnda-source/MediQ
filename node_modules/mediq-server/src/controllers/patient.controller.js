const prisma = require('../lib/prisma');
const queueService = require('../services/queue.service');
const etaService = require('../services/eta.service');
const { emitQueueUpdate } = require('../sockets/queue.socket');

/**
 * Pendaftaran Mandiri Pasien (Booking Online)
 */
async function bookQueue(req, res, next) {
  try {
    const {
      nik,
      name,
      phone,
      email,
      address,
      gender,
      birthDate,
      doctorId,
      polyclinicId,
      queueDate,
      complaint,
    } = req.body;

    // Validasi input
    if (!nik || !name || !phone || !doctorId || !polyclinicId || !queueDate) {
      return res.status(400).json({
        success: false,
        message: 'NIK, Nama, Nomor HP, Dokter, Poliklinik, dan Tanggal Kunjungan wajib diisi.',
      });
    }

    if (nik.length < 16) {
      return res.status(400).json({
        success: false,
        message: 'Format NIK harus 16 digit.',
      });
    }

    const result = await queueService.bookQueue({
      nik: nik.trim(),
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : null,
      address: address ? address.trim() : null,
      gender: gender || 'L',
      birthDate,
      doctorId,
      polyclinicId,
      queueDate,
      complaint,
    });

    // Broadcast ke admin/dashboard ada antrean baru
    emitQueueUpdate(result.queue, 'NEW_BOOKING');

    res.status(201).json({
      success: true,
      message: 'Booking berhasil! Simpan e-tiket QR Code Anda untuk check-in di klinik.',
      data: result.queue,
      qrCodeUrl: result.qrCodeUrl,
      eta: result.eta,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Ambil Detail Tiket Pasien Berdasarkan Kode Booking
 */
async function getTicketByBookingCode(req, res, next) {
  try {
    const { bookingCode } = req.params;

    if (!bookingCode) {
      return res.status(400).json({
        success: false,
        message: 'Kode booking wajib disertakan.',
      });
    }

    const queue = await prisma.queue.findUnique({
      where: { bookingCode: bookingCode.trim() },
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

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: 'Tiket antrean tidak ditemukan.',
      });
    }

    // Dynamic ETA
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

/**
 * Riwayat Kunjungan Pasien Berdasarkan NIK (Untuk Portal Pasien & Lookup)
 */
async function getPatientHistory(req, res, next) {
  try {
    const { nik } = req.params;

    if (!nik) {
      return res.status(400).json({
        success: false,
        message: 'Nomor NIK harus disertakan.',
      });
    }

    const patient = await prisma.patient.findUnique({
      where: { nik: nik.trim() },
      include: {
        queues: {
          include: {
            doctor: {
              include: { user: { select: { name: true } } },
            },
            polyclinic: true,
          },
          orderBy: [
            { queueDate: 'desc' },
            { createdAt: 'desc' },
          ],
          take: 50,
        },
      },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: `Data pasien dengan NIK ${nik} belum terdaftar di sistem.`,
      });
    }

    res.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Riwayat Medis Pasien Berdasarkan ID Pasien (Untuk Panel Dokter saat Pemeriksaan)
 */
async function getPatientHistoryById(req, res, next) {
  try {
    const { id } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        queues: {
          include: {
            doctor: {
              include: { user: { select: { name: true } } },
            },
            polyclinic: true,
          },
          orderBy: [
            { queueDate: 'desc' },
            { createdAt: 'desc' },
          ],
          take: 50,
        },
      },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Pasien tidak ditemukan.',
      });
    }

    res.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Pencarian Pasien Berdasarkan Nama atau NIK (Untuk Admin & Dokter)
 */
async function searchPatients(req, res, next) {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Kata kunci pencarian minimal 2 karakter.',
      });
    }

    const query = q.trim();

    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          { nik: { contains: query } },
          { name: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
        ],
      },
      include: {
        _count: {
          select: { queues: true },
        },
      },
      take: 20,
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: patients,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  bookQueue,
  getTicketByBookingCode,
  getPatientHistory,
  getPatientHistoryById,
  searchPatients,
};
