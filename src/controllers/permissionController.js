const Permission = require('../models/Permission');
const auditService = require('../services/auditService');

/**
 * GET /api/permissions
 */
const getPermissions = async (req, res, next) => {
  try {
    const permissions = await Permission.find().sort('category name');
    res.json({ permissions, total: permissions.length });
  } catch (err) { next(err); }
};

/**
 * GET /api/permissions/:id
 */
const getPermissionById = async (req, res, next) => {
  try {
    const permission = await Permission.findById(req.params.id);
    if (!permission) return res.status(404).json({ error: 'Permís no trobat', code: 'NOT_FOUND' });
    res.json(permission);
  } catch (err) { next(err); }
};

/**
 * POST /api/permissions
 */
const createPermission = async (req, res, next) => {
  try {
    const { name, description, category } = req.body;
    const permission = await Permission.create({ name, description, category });
    await auditService.logAction(req.user._id, 'permissions:create', String(permission._id), 'permission', null, 'success', auditService.extractMeta(req));
    res.status(201).json(permission);
  } catch (err) {
    if (err.code === 11000) {
      const e = new Error('Ja existeix un permís amb aquest nom');
      e.statusCode = 400; e.code = 'DUPLICATE_PERMISSION';
      return next(e);
    }
    next(err);
  }
};

/**
 * PUT /api/permissions/:id
 */
const updatePermission = async (req, res, next) => {
  try {
    const { description } = req.body;
    const permission = await Permission.findByIdAndUpdate(req.params.id, { description }, { new: true });
    if (!permission) return res.status(404).json({ error: 'Permís no trobat', code: 'NOT_FOUND' });
    await auditService.logAction(req.user._id, 'permissions:update', req.params.id, 'permission', { description }, 'success', auditService.extractMeta(req));
    res.json(permission);
  } catch (err) { next(err); }
};

/**
 * DELETE /api/permissions/:id
 */
const deletePermission = async (req, res, next) => {
  try {
    const permission = await Permission.findByIdAndDelete(req.params.id);
    if (!permission) return res.status(404).json({ error: 'Permís no trobat', code: 'NOT_FOUND' });
    await auditService.logAction(req.user._id, 'permissions:delete', req.params.id, 'permission', null, 'success', auditService.extractMeta(req));
    res.json({ message: 'Permís eliminat correctament' });
  } catch (err) { next(err); }
};

module.exports = { getPermissions, getPermissionById, createPermission, updatePermission, deletePermission };
