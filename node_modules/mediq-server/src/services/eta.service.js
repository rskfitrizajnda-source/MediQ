const prisma = require('../lib/prisma');

/**
 * Layanan Kalkulasi Dynamic ETA (Estimated Time of Arrival / Waktu Tunggu Dinamis)
 * Menghitung perkiraan waktu tunggu dan jam panggil pasien berdasarkan:
 * 1. Durasi rata-rata riil konsultasi dokter hari ini (atau default dokter).
 * 2. Pasien yang saat ini sedang berada di dalam ruang dokter (IN_CONSULTATION).
 * 3. Jumlah pasien yang antre di depan (CALLING & CHECKED_IN).
 */
class EtaService {
  /**
   * Menghitung rata-rata durasi konsultasi dokter hari ini (dalam menit)
   * Menggunakan moving average dari pasien yang sudah COMPLETED.
   */
  async getDoctorAverageDuration(doctorId, fallbackMinutes = 12) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedToday = await prisma.queue.findMany({
      where: {
        doctorId,
        queueDate: { gte: today },
        status: 'COMPLETED',
        startTime: { not: null },
        endTime: { not: null },
      },
      select: {
        startTime: true,
        endTime: true,
      },
      take: 10,
      orderBy: { endTime: 'desc' },
    });

    if (completedToday.length === 0) {
      return fallbackMinutes;
    }

    let totalDurationMinutes = 0;
    for (const q of completedToday) {
      const diffMs = new Date(q.endTime).getTime() - new Date(q.startTime).getTime();
      const diffMins = Math.max(3, Math.round(diffMs / (1000 * 60)));
      totalDurationMinutes += diffMins;
    }

    const calculatedAvg = Math.round(totalDurationMinutes / completedToday.length);
    // Batasi dalam rentang wajar (5 s/d 45 menit)
    return Math.min(Math.max(calculatedAvg, 5), 45);
  }

  /**
   * Menghitung Dynamic ETA untuk antrean tertentu
   * @param {string} queueId
   * @returns {Promise<{ estimatedMinutes: number, estimatedTime: Date, patientsAhead: number, currentServingTicket: string|null }>}
   */
  async calculateQueueEta(queueId) {
    const targetQueue = await prisma.queue.findUnique({
      where: { id: queueId },
      include: {
        doctor: true,
        polyclinic: true,
      },
    });

    if (!targetQueue) {
      throw new Error('Data antrean tidak ditemukan');
    }

    // Jika sudah dipanggil atau selesai
    if (targetQueue.status === 'IN_CONSULTATION' || targetQueue.status === 'CALLING') {
      return {
        estimatedMinutes: 0,
        estimatedTime: new Date(),
        patientsAhead: 0,
        currentServingTicket: targetQueue.ticketNumber,
      };
    }

    if (targetQueue.status === 'COMPLETED' || targetQueue.status === 'CANCELLED' || targetQueue.status === 'SKIPPED') {
      return {
        estimatedMinutes: 0,
        estimatedTime: targetQueue.endTime || new Date(),
        patientsAhead: 0,
        currentServingTicket: null,
      };
    }

    const today = new Date(targetQueue.queueDate);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Ambil rata-rata durasi dokter
    const avgMinutes = await this.getDoctorAverageDuration(
      targetQueue.doctorId,
      targetQueue.doctor.avgConsultationMinutes || 12
    );

    // Cek pasien yang saat ini sedang konsultasi (IN_CONSULTATION)
    const currentInConsultation = await prisma.queue.findFirst({
      where: {
        doctorId: targetQueue.doctorId,
        queueDate: { gte: today, lt: tomorrow },
        status: 'IN_CONSULTATION',
      },
      orderBy: { startTime: 'desc' },
    });

    let currentServingTicket = currentInConsultation ? currentInConsultation.ticketNumber : null;
    let remainingCurrentPatientMinutes = 0;

    if (currentInConsultation && currentInConsultation.startTime) {
      const elapsedMs = Date.now() - new Date(currentInConsultation.startTime).getTime();
      const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
      if (elapsedMinutes < avgMinutes) {
        remainingCurrentPatientMinutes = avgMinutes - elapsedMinutes;
      } else {
        // Jika sudah melebihi rata-rata, asumsikan akan segera selesai dalam 2-3 menit
        remainingCurrentPatientMinutes = 2;
      }
    }

    // Ambil pasien yang statusnya CALLING (jika ada yang dipanggil tapi belum masuk)
    const callingPatient = await prisma.queue.findFirst({
      where: {
        doctorId: targetQueue.doctorId,
        queueDate: { gte: today, lt: tomorrow },
        status: 'CALLING',
      },
    });

    if (callingPatient && !currentServingTicket) {
      currentServingTicket = callingPatient.ticketNumber;
    }

    // Hitung antrean di depan antrean target
    // Pasien di depan adalah pasien dengan sequenceNumber lebih kecil dan status CHECKED_IN atau CALLING
    const aheadQueues = await prisma.queue.findMany({
      where: {
        doctorId: targetQueue.doctorId,
        queueDate: { gte: today, lt: tomorrow },
        sequenceNumber: { lt: targetQueue.sequenceNumber },
        status: { in: ['CHECKED_IN', 'CALLING'] },
      },
    });

    const patientsAhead = aheadQueues.length + (currentInConsultation ? 1 : 0);

    // Perhitungan total estimasi menit:
    // (Sisa waktu pasien saat ini) + (Jumlah pasien antre di depan * avgMinutes)
    const totalEstimatedMinutes =
      remainingCurrentPatientMinutes + aheadQueues.length * avgMinutes;

    const estimatedDate = new Date(Date.now() + totalEstimatedMinutes * 60 * 1000);

    return {
      estimatedMinutes: Math.max(totalEstimatedMinutes, 1),
      estimatedTime: estimatedDate,
      patientsAhead,
      currentServingTicket,
      avgConsultationDuration: avgMinutes,
    };
  }

  /**
   * Update massal ETA untuk semua antrean aktif di suatu dokter
   */
  async updateDoctorQueuesEta(doctorId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeQueues = await prisma.queue.findMany({
      where: {
        doctorId,
        queueDate: { gte: today, lt: tomorrow },
        status: { in: ['PENDING', 'CHECKED_IN'] },
      },
      orderBy: { sequenceNumber: 'asc' },
    });

    for (const q of activeQueues) {
      const eta = await this.calculateQueueEta(q.id);
      await prisma.queue.update({
        where: { id: q.id },
        data: { estimatedTime: eta.estimatedTime },
      });
    }
  }
}

module.exports = new EtaService();

