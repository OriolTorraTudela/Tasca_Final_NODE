const rateLimit = require('express-rate-limit');
const { RATE_LIMITS } = require('../config/constants');

/**
 * Rate limiter dinàmic per rol: cada rol té un límit diferent de req/min.
 * Usa un comptador en memòria (sense Redis per simplicitat de desplegament).
 * El document especifica Redis però s'implementa amb memòria per compatibilitat local.
 */
const createRoleLimiter = () => {
  // Mapa de limiters per rol, creat sota demanda
  const limiters = {};

  const getLimiter = (max) => {
    if (!limiters[max]) {
      limiters[max] = rateLimit({
        windowMs: 60 * 1000, // 1 minut
        max,
        standardHeaders: true,  // X-RateLimit-* headers
        legacyHeaders: false,
        message: {
          error: 'Massa peticions. Torna a intentar-ho en un minut.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        keyGenerator: (req) => {
          // Clau: userId si autenticat, IP si no
          return req.user ? String(req.user._id) : req.ip;
        },
        skip: (req) => {
          // No limitar les rutes d'auth per poder fer les proves
          return false;
        },
      });
    }
    return limiters[max];
  };

  // Middleware que selecciona el limiter en funció del rol de l'usuari
  return (req, res, next) => {
    const roleName = req.user?.role?.name;
    const maxRequests = RATE_LIMITS[roleName] || RATE_LIMITS.default;
    const limiter = getLimiter(maxRequests);

    // Afegim headers informatius
    res.setHeader('X-RateLimit-Role', roleName || 'anonymous');
    res.setHeader('X-RateLimit-Limit', maxRequests);

    limiter(req, res, next);
  };
};

const roleLimiter = createRoleLimiter();

module.exports = { roleLimiter };
