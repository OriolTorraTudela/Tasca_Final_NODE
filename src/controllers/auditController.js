const AuditLog = require('../models/AuditLog');

/**
 * GET /api/audit/logs
 * Suporta filtratge per action, userId, resourceType, status i rang de dates
 */
const getLogs = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.action) filter.action = new RegExp(req.query.action, 'i');
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.resourceType) filter.resourceType = req.query.resourceType;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.from || req.query.to) {
      filter.timestamp = {};
      if (req.query.from) filter.timestamp.$gte = new Date(req.query.from);
      if (req.query.to) filter.timestamp.$lte = new Date(req.query.to);
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, parseInt(req.query.limit) || 50);

    const [logs, total] = await Promise.all([
      AuditLog.find(filter).populate('userId', 'email firstName lastName').sort('-timestamp').skip((page - 1) * limit).limit(limit),
      AuditLog.countDocuments(filter),
    ]);

    res.json({ logs, total, page, limit });
  } catch (err) { next(err); }
};

/**
 * GET /api/audit/stats
 * Estadístiques globals d'auditoria (accions, usuaris actius, errors)
 */
const getStats = async (req, res, next) => {
  try {
    const [totalActions, byAction, byStatus, byResourceType] = await Promise.all([
      AuditLog.countDocuments(),
      AuditLog.aggregate([{ $group: { _id: '$action', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
      AuditLog.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      AuditLog.aggregate([{ $group: { _id: '$resourceType', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    ]);

    res.json({ totalActions, topActions: byAction, byStatus, byResourceType });
  } catch (err) { next(err); }
};

/**
 * GET /api/audit/stats/user/:userId
 */
const getUserStats = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const [total, byAction, lastActivity] = await Promise.all([
      AuditLog.countDocuments({ userId }),
      AuditLog.aggregate([{ $match: { userId: require('mongoose').Types.ObjectId.createFromHexString(userId) } }, { $group: { _id: '$action', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      AuditLog.findOne({ userId }).sort('-timestamp'),
    ]);

    res.json({ userId, totalActions: total, topActions: byAction, lastActivity: lastActivity?.timestamp || null });
  } catch (err) { next(err); }
};

/**
 * GET /api/audit/export?format=csv
 */
const exportLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find().populate('userId', 'email').sort('-timestamp').limit(1000);

    const format = req.query.format || 'json';
    if (format === 'csv') {
      const header = 'timestamp,userId,action,resource,resourceType,status,ipAddress\n';
      const rows = logs.map(l =>
        `"${l.timestamp.toISOString()}","${l.userId?.email || ''}","${l.action}","${l.resource || ''}","${l.resourceType || ''}","${l.status}","${l.ipAddress || ''}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="audit_logs.csv"');
      return res.send(header + rows);
    }

    res.json({ logs, total: logs.length });
  } catch (err) { next(err); }
};

module.exports = { getLogs, getStats, getUserStats, exportLogs };
