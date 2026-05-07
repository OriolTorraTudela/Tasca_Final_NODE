const { ROLE_LEVELS } = require('../config/constants');
const permissionService = require('../services/permissionService');

/**
 * Comprova que l'usuari té un nivell de rol mínim (jerarquia)
 * @param {number} minLevel - nivell mínim requerit (ex: 4 per ADMIN)
 */
const requireLevel = (minLevel) => async (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticat' });

  const userLevel = ROLE_LEVELS[req.user.role?.name] || 0;
  if (userLevel < minLevel) {
    return res.status(403).json({ error: 'No tens permís suficient', code: 'INSUFFICIENT_ROLE' });
  }
  next();
};

/**
 * Comprova que l'usuari té un permís concret (via rol o delegació)
 * @param {string} permission - ex: "tasks:create"
 */
const requirePermission = (permission) => async (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticat' });

  const hasIt = await permissionService.userHasPermission(req.user, permission);
  if (!hasIt) {
    return res.status(403).json({
      error: `No tens el permís requerit: ${permission}`,
      code: 'INSUFFICIENT_PERMISSION',
    });
  }
  next();
};

/**
 * Comprova que el nom del rol de l'usuari és un dels permesos
 * @param {...string} roles - noms de rols permesos
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticat' });
  const userRole = req.user.role?.name;
  if (!roles.includes(userRole)) {
    return res.status(403).json({ error: 'Rol no autoritzat', code: 'ROLE_FORBIDDEN' });
  }
  next();
};

module.exports = { requireLevel, requirePermission, requireRole };
