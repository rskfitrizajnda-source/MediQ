const prisma = require('../lib/prisma');
const etaService = require('../services/eta.service');

/**
 * Ambil Antrean Dokter yang Sedang Login Hari Ini
 */
async function getDoctorQueues(req, res, next) {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user.id },
      include: { polyclinic: true },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Profil dokter untuk pengguna ini tidak ditemukan.',
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const queues = await prisma.queue.findMany({
      where: {
        doctorId: doctor.id,
        queueDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        patient: true,
        polyclinic: true,
      },
      orderBy: { sequenceNumber: 'asc' },
    });

    // Pasien yang sedang aktif (CALLING atau IN_CONSULTATION)
    const activePatient = queues.find((q) =>
      ['CALLING', 'IN_CONSULTATION'].includes(q.status)
    );

    // Pasien berikutnya yang siap dipanggil (CHECKED_IN)
    const nextInLine = queues.find((q) => q.status === 'CHECKED_IN');

    // Rata-rata durasi aktual konsultasi hari ini
    const actualAvgDuration = await etaService.getDoctorAverageDuration(
      doctor.id,
      doctor.avgConsultationMinutes
    );

    res.json({
      success: true,
      doctor,
      activePatient: activePatient || null,
      nextInLine: nextInLine || null,
      queues,
      stats: {
        total: queues.length,
        checkedIn: queues.filter((q) => q.status === 'CHECKED_IN').length,
        completed: queues.filter((q) => q.status === 'COMPLETED').length,
        skipped: queues.filter((q) => q.status === 'SKIPPED').length,
        pending: queues.filter((q) => q.status === 'PENDING').length,
        actualAvgDuration,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Ambil Pengaturan Jadwal & Kuota Dokter
 */
async function getDoctorSchedule(req, res, next) {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user.id },
      include: {
        polyclinic: true,
        user: { select: { name: true, email: true } },
      },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Data dokter tidak ditemukan.',
      });
    }

    res.json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Perbarui Pengaturan Jadwal & Kuota Dokter
 */
async function updateDoctorSchedule(req, res, next) {
  try {
    const {
      quotaPerDay,
      avgConsultationMinutes,
      startTime,
      endTime,
      scheduleDays,
      isActive,
      roomNumber,
    } = req.body;

    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user.id },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Data dokter tidak ditemukan.',
      });
    }

    const updated = await prisma.doctor.update({
      where: { id: doctor.id },
      data: {
        quotaPerDay: quotaPerDay ? parseInt(quotaPerDay, 10) : doctor.quotaPerDay,
        avgConsultationMinutes: avgConsultationMinutes
          ? parseInt(avgConsultationMinutes, 10)
          : doctor.avgConsultationMinutes,
        startTime: startTime || doctor.startTime,
        endTime: endTime || doctor.endTime,
        scheduleDays: scheduleDays || doctor.scheduleDays,
        isActive: typeof isActive === 'boolean' ? isActive : doctor.isActive,
        roomNumber: roomNumber || doctor.roomNumber,
      },
      include: { polyclinic: true },
    });

    res.json({
      success: true,
      message: 'Jadwal dan kuota dokter berhasil diperbarui.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDoctorQueues,
  getDoctorSchedule,
  updateDoctorSchedule,
};

