const mongoose = require('mongoose');

/**
 * Registre d'auditoria avançat: qui, què, quan, on i quins canvis
 */
const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  action: { type: String, required: true },       // ex: "tasks:update"
  resource: { type: String, default: null },       // ID del recurs afectat
  resourceType: { type: String, default: null },   // ex: "task", "user"
  status: { type: String, enum: ['success', 'error', 'denied'], default: 'success' },
  changes: { type: mongoose.Schema.Types.Mixed, default: null }, // { field: { old, new } }
  ipAddress: { type: String, default: null },
  userAgent: { type: String, default: null },
  timestamp: { type: Date, default: Date.now },
  duration: { type: Number, default: null }, // mil·lisegons
});

auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ resourceType: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
