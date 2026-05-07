/**
 * Middleware centralitzat de gestió d'errors.
 * Captura tots els errors llençats als controllers i retorna JSON consistent.
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error intern del servidor';

  // Log a consola en desenvolupament
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[ERROR] ${req.method} ${req.path} - ${statusCode}: ${message}`);
    if (statusCode === 500) console.error(err.stack);
  }

  res.status(statusCode).json({
    error: message,
    code: err.code || (statusCode === 500 ? 'INTERNAL_ERROR' : 'ERROR'),
    ...(process.env.NODE_ENV === 'development' && statusCode === 500 ? { stack: err.stack } : {}),
  });
};

/**
 * Handler per a rutes no trobades (404)
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({ error: `Ruta no trobada: ${req.method} ${req.path}`, code: 'NOT_FOUND' });
};

module.exports = { errorHandler, notFoundHandler };
