const prisma = require('../lib/prisma');

/**
 * Ambil Daftar Poliklinik Beserta Dokternya
 */
async function getPolyclinics(req, res, next) {
  try {
    const polyclinics = await prisma.polyclinic.findMany({
      include: {
        doctors: {
          where: { isActive: true },
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    res.json({
      success: true,
      data: polyclinics,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Ambil Daftar Dokter
 */
async function getDoctors(req, res, next) {
  try {
    const doctors = await prisma.doctor.findMany({
      where: { isActive: true },
      include: {
        user: { select: { name: true, email: true } },
        polyclinic: true,
      },
      orderBy: { roomNumber: 'asc' },
    });

    res.json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Ambil Pengaturan Klinik
 */
async function getClinicSettings(req, res, next) {
  try {
    let settings = await prisma.clinicSetting.findFirst();

    if (!settings) {
      settings = await prisma.clinicSetting.create({
        data: {
          clinicName: 'Klinik Pratama MediQ',
          runningText: 'Selamat datang di MediQ. Harap menjaga kenyamanan bersama.',
        },
      });
    }

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update Pengaturan Klinik (Admin Saja)
 */
async function updateClinicSettings(req, res, next) {
  try {
    const { clinicName, address, phone, runningText, audioGreeting, autoCallRepeat } = req.body;

    let settings = await prisma.clinicSetting.findFirst();

    if (settings) {
      settings = await prisma.clinicSetting.update({
        where: { id: settings.id },
        data: {
          clinicName: clinicName || settings.clinicName,
          address: address || settings.address,
          phone: phone || settings.phone,
          runningText: runningText || settings.runningText,
          audioGreeting: audioGreeting || settings.audioGreeting,
          autoCallRepeat: autoCallRepeat ? parseInt(autoCallRepeat, 10) : settings.autoCallRepeat,
        },
      });
    } else {
      settings = await prisma.clinicSetting.create({
        data: {
          clinicName: clinicName || 'Klinik Pratama MediQ',
          address: address || 'Jl. Kesehatan No. 1',
          phone: phone || '021-123456',
          runningText: runningText || 'Selamat datang di Klinik Pratama MediQ.',
        },
      });
    }

    res.json({
      success: true,
      message: 'Pengaturan klinik berhasil diperbarui.',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Ringkasan Dasbor Admin (Overview Hari Ini)
 */
async function getAdminOverview(req, res, next) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const totalPatientsToday = await prisma.queue.count({
      where: {
        queueDate: { gte: today, lt: tomorrow },
        status: { notIn: ['CANCELLED'] },
      },
    });

    const checkedInCount = await prisma.queue.count({
      where: {
        queueDate: { gte: today, lt: tomorrow },
        status: 'CHECKED_IN',
      },
    });

    const callingCount = await prisma.queue.count({
      where: {
        queueDate: { gte: today, lt: tomorrow },
        status: 'CALLING',
      },
    });

    const inConsultationCount = await prisma.queue.count({
      where: {
        queueDate: { gte: today, lt: tomorrow },
        status: 'IN_CONSULTATION',
      },
    });

    const completedCount = await prisma.queue.count({
      where: {
        queueDate: { gte: today, lt: tomorrow },
        status: 'COMPLETED',
      },
    });

    const pendingCount = await prisma.queue.count({
      where: {
        queueDate: { gte: today, lt: tomorrow },
        status: 'PENDING',
      },
    });

    // Breakdown per polyclinic
    const polyclinics = await prisma.polyclinic.findMany({
      include: {
        queues: {
          where: {
            queueDate: { gte: today, lt: tomorrow },
          },
        },
      },
    });

    const polyclinicStats = polyclinics.map((p) => ({
      id: p.id,
      name: p.name,
      code: p.code,
      color: p.color,
      total: p.queues.length,
      waiting: p.queues.filter((q) => ['CHECKED_IN', 'PENDING'].includes(q.status)).length,
      inProgress: p.queues.filter((q) => ['CALLING', 'IN_CONSULTATION'].includes(q.status)).length,
      completed: p.queues.filter((q) => q.status === 'COMPLETED').length,
    }));

    res.json({
      success: true,
      stats: {
        totalPatientsToday,
        checkedInCount,
        inProgressCount: callingCount + inConsultationCount,
        completedCount,
        pendingCount,
      },
      polyclinicStats,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPolyclinics,
  getDoctors,
  getClinicSettings,
  updateClinicSettings,
  getAdminOverview,
};

