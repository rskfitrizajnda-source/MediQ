require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { initQueueSocket } = require('./sockets/queue.socket');
const prisma = require('./lib/prisma');

const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (process.env.NODE_ENV === 'production') {
  const missing = ['DATABASE_URL', 'JWT_SECRET', 'CLIENT_URL']
    .filter((key) => !process.env[key] || !process.env[key].trim());

  if (missing.length) {
    console.error(`Konfigurasi production belum lengkap: ${missing.join(', ')}`);
    process.exit(1);
  }

  if (process.env.JWT_SECRET.length < 32) {
    console.error('JWT_SECRET production harus memiliki minimal 32 karakter.');
    process.exit(1);
  }

  if (/mediq_super_secret|change_me|replace_with/i.test(process.env.JWT_SECRET)) {
    console.error('JWT_SECRET masih berupa nilai contoh. Buat secret acak baru.');
    process.exit(1);
  }
}

const server = http.createServer(app);

// Socket.io memakai daftar origin frontend yang sama dengan Express.
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

initQueueSocket(io);

server.listen(PORT, '0.0.0.0', () => {
  console.log('===============================================');
  console.log(` MediQ Server berjalan di port: ${PORT}`);
  console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Healthcheck: /api/health`);
  console.log(' WebSocket realtime: Ready');
  console.log('===============================================');
});

async function shutdown(signal) {
  console.log(`${signal} diterima: menutup server HTTP`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
