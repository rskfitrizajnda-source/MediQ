function errorHandler(err, req, res, next) {
  console.error('[Error Middleware]:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Terjadi kesalahan internal server.';

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}

function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Rute '${req.originalUrl}' tidak ditemukan di server MediQ.`,
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};

