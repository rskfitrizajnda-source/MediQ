require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { initQueueSocket } = require('./sockets/queue.socket');
const prisma = require('./lib/prisma');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Inisialisasi Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Setup socket event handler
initQueueSocket(io);

// Start server
server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` MediQ Server Berjalan di Port: ${PORT}`);
  console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Healthcheck: http://localhost:${PORT}/api/health`);
  console.log(` WebSocket Realtime: Ready`);
  console.log(`===============================================`);
});


// Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal diterima: menutup HTTP server');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('HTTP server ditutup & prisma disconnect');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal diterima: mematikan server');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Server berhasil dimatikan');
    process.exit(0);
  });
});

