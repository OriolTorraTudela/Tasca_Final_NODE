const auditService = require('../services/auditService');

/**
 * Middleware d'auditoria: registra automàticament cada petició autenticada.
 * S'utilitza en rutes específiques per registrar accions sensibles.
 * @param {string} action - acció a registrar (ex: "tasks:read")
 * @param {string} resourceType - tipus de recurs (ex: "task")
 */
const auditRequest = (action, resourceType) => async (req, res, next) => {
  const startTime = Date.now();
  const meta = auditService.extractMeta(req, startTime);

  // Patchem res.json per capturar el resultat
  const originalJson = res.json.bind(res);
  res.json = function (data) {
    const status = res.statusCode >= 400 ? 'error' : 'success';
    const resourceId = req.params?.id || data?._id || data?.data?._id || null;

    auditService.logAction(
      req.user?._id || null,
      action,
      resourceId ? String(resourceId) : null,
      resourceType,
      null,
      status,
      { ...meta, duration: Date.now() - startTime }
    );

    return originalJson(data);
  };

  next();
};

module.exports = { auditRequest };
