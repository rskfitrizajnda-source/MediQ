let ioInstance = null;

function initQueueSocket(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client terhubung: ${socket.id}`);

    // Join room khusus TV Display
    socket.on('join:tv', () => {
      socket.join('room:tv');
      console.log(`[Socket.io] Socket ${socket.id} bergabung ke room:tv`);
    });

    // Join room khusus dokter tertentu
    socket.on('join:doctor', (doctorId) => {
      if (doctorId) {
        socket.join(`room:doctor:${doctorId}`);
        console.log(`[Socket.io] Socket ${socket.id} bergabung ke room:doctor:${doctorId}`);
      }
    });

    // Join room khusus pasien memantau tiketnya sendiri
    socket.on('join:patient', (queueId) => {
      if (queueId) {
        socket.join(`room:queue:${queueId}`);
        console.log(`[Socket.io] Pasien ${socket.id} memantau antrean: ${queueId}`);
      }
    });

    // Join room umum klinik (admin & resepsionis)
    socket.on('join:admin', () => {
      socket.join('room:admin');
      console.log(`[Socket.io] Admin ${socket.id} bergabung ke room:admin`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client terputus: ${socket.id}`);
    });
  });
}

/**
 * Mengirim notifikasi panggil pasien ke Smart TV & Pasien
 */
function emitQueueCalled(queueData) {
  if (!ioInstance) return;

  const payload = {
    queueId: queueData.id,
    ticketNumber: queueData.ticketNumber,
    patientName: queueData.patient?.name || 'Pasien',
    polyclinicName: queueData.polyclinic?.name || 'Poliklinik',
    polyclinicCode: queueData.polyclinic?.code || 'A',
    roomNumber: queueData.doctor?.roomNumber || 'Ruang Dokter',
    doctorName: queueData.doctor?.user?.name || 'Dokter Pemeriksa',
    callCount: queueData.callCount,
    calledTime: queueData.calledTime || new Date(),
    speechText: `Nomor antrean ${queueData.ticketNumber}, silakan menuju ${queueData.polyclinic?.name}, ${queueData.doctor?.roomNumber}.`,
  };

  // Broadcast ke TV Display agar memicu Web Speech API
  ioInstance.to('room:tv').emit('queue:called', payload);

  // Broadcast ke Pasien spesifik
  ioInstance.to(`room:queue:${queueData.id}`).emit('queue:called', payload);

  // Update ke Dokter & Admin
  ioInstance.to('room:admin').emit('queue:updated', payload);
  if (queueData.doctorId) {
    ioInstance.to(`room:doctor:${queueData.doctorId}`).emit('queue:updated', payload);
  }
}

/**
 * Mengirim update status antrean ke seluruh ruangan yang relevan
 */
function emitQueueUpdate(queueData, action = 'UPDATE') {
  if (!ioInstance) return;

  const payload = {
    action,
    queue: queueData,
    timestamp: new Date(),
  };

  ioInstance.emit('queue:status_changed', payload);
  ioInstance.to('room:tv').emit('tv:refresh');
  ioInstance.to('room:admin').emit('queue:updated', payload);
  if (queueData.id) {
    ioInstance.to(`room:queue:${queueData.id}`).emit('queue:my_status_changed', queueData);
  }
  if (queueData.doctorId) {
    ioInstance.to(`room:doctor:${queueData.doctorId}`).emit('queue:updated', payload);
  }
}

function getIO() {
  return ioInstance;
}

module.exports = {
  initQueueSocket,
  emitQueueCalled,
  emitQueueUpdate,
  getIO,
};

