const AuditLog = require('../models/AuditLog');

/**
 * Registra una acció al log d'auditoria
 * @param {string|null} userId
 * @param {string} action - ex: "tasks:update"
 * @param {string|null} resource - ID del recurs
 * @param {string|null} resourceType - ex: "task"
 * @param {object|null} changes - { field: { old, new } }
 * @param {string} status - "success" | "error" | "denied"
 * @param {object} meta - { ipAddress, userAgent, duration }
 */
const logAction = async (userId, action, resource, resourceType, changes, status = 'success', meta = {}) => {
  try {
    await AuditLog.create({
      userId: userId || null,
      action,
      resource,
      resourceType,
      status,
      changes,
      ipAddress: meta.ipAddress || null,
      userAgent: meta.userAgent || null,
      duration: meta.duration || null,
    });
  } catch (err) {
    // L'auditoria no ha de trencar el flux principal
    console.error('Error registrant auditoria:', err.message);
  }
};

/**
 * Extreu metadata de la petició HTTP per a l'auditoria
 * @param {object} req - Express request
 */
const extractMeta = (req, startTime = null) => ({
  ipAddress: req.ip || req.connection?.remoteAddress || null,
  userAgent: req.get('User-Agent') || null,
  duration: startTime ? Date.now() - startTime : null,
});

module.exports = { logAction, extractMeta };
