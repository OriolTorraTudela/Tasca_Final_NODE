const User = require('../models/User');
const permissionService = require('../services/permissionService');
const auditService = require('../services/auditService');

/**
 * GET /api/users
 */
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({ isActive: true }).populate('role', 'name level').select('-password');
    res.json({ users, total: users.length });
  } catch (err) { next(err); }
};

/**
 * GET /api/users/:id
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('role').select('-password');
    if (!user) return res.status(404).json({ error: 'Usuari no trobat', code: 'NOT_FOUND' });
    res.json(user);
  } catch (err) { next(err); }
};

/**
 * PUT /api/users/:id
 */
const updateUser = async (req, res, next) => {
  try {
    const { firstName, lastName, isActive } = req.body;
    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;

    // Només ADMIN pot canviar isActive
    const userLevel = req.user?.role?.level || 0;
    if (isActive !== undefined && userLevel >= 4) updates.isActive = isActive;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).populate('role').select('-password');
    if (!user) return res.status(404).json({ error: 'Usuari no trobat', code: 'NOT_FOUND' });

    await auditService.logAction(req.user._id, 'users:update', req.params.id, 'user', updates, 'success', auditService.extractMeta(req));
    res.json(user);
  } catch (err) { next(err); }
};

/**
 * DELETE /api/users/:id (soft delete)
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ error: 'Usuari no trobat', code: 'NOT_FOUND' });
    await auditService.logAction(req.user._id, 'users:delete', req.params.id, 'user', null, 'success', auditService.extractMeta(req));
    res.json({ message: 'Usuari eliminat correctament' });
  } catch (err) { next(err); }
};

/**
 * GET /api/users/:id/permissions
 * Retorna tots els permisos efectius (rol + delegats)
 */
const getUserPermissions = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('role');
    if (!user) return res.status(404).json({ error: 'Usuari no trobat', code: 'NOT_FOUND' });

    const rolePerms = await permissionService.getRolePermissions(user.role?._id);
    const delegated = await permissionService.getActiveDelegations(req.params.id);

    res.json({
      userId: user._id,
      role: user.role?.name,
      rolePermissions: rolePerms,
      delegatedPermissions: delegated,
      allPermissions: [...new Set([...rolePerms, ...delegated])],
    });
  } catch (err) { next(err); }
};

module.exports = { getUsers, getUserById, updateUser, deleteUser, getUserPermissions };
