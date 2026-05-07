const Role = require('../models/Role');
const permissionService = require('../services/permissionService');
const auditService = require('../services/auditService');

/**
 * GET /api/roles
 */
const getRoles = async (req, res, next) => {
  try {
    const roles = await Role.find({ isActive: true }).populate('permissions', 'name category').sort('level');
    res.json({ roles, total: roles.length });
  } catch (err) { next(err); }
};

/**
 * GET /api/roles/:id
 */
const getRoleById = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id).populate('permissions').populate('parentRole', 'name level');
    if (!role) return res.status(404).json({ error: 'Rol no trobat', code: 'NOT_FOUND' });
    res.json(role);
  } catch (err) { next(err); }
};

/**
 * POST /api/roles
 */
const createRole = async (req, res, next) => {
  try {
    const { name, level, parentRole, permissions, description } = req.body;

    // Valida que el rol pare té nivell superior al nou rol
    if (parentRole) {
      const parent = await Role.findById(parentRole);
      if (!parent) return res.status(400).json({ error: 'Rol pare no trobat', code: 'INVALID_HIERARCHY' });
      if (parent.level >= level) {
        return res.status(400).json({ error: 'El rol pare ha de tenir un nivell inferior al rol fill', code: 'INVALID_HIERARCHY' });
      }
    }

    const role = await Role.create({ name, level, parentRole: parentRole || null, permissions: permissions || [], description });
    await auditService.logAction(req.user._id, 'roles:create', String(role._id), 'role', null, 'success', auditService.extractMeta(req));
    res.status(201).json(role);
  } catch (err) {
    if (err.code === 11000) {
      const e = new Error('Ja existeix un rol amb aquest nom');
      e.statusCode = 400; e.code = 'DUPLICATE_ROLE';
      return next(e);
    }
    next(err);
  }
};

/**
 * PUT /api/roles/:id
 */
const updateRole = async (req, res, next) => {
  try {
    const { description, permissions, isActive } = req.body;
    const updates = {};
    if (description !== undefined) updates.description = description;
    if (permissions !== undefined) updates.permissions = permissions;
    if (isActive !== undefined) updates.isActive = isActive;

    const role = await Role.findByIdAndUpdate(req.params.id, updates, { new: true }).populate('permissions');
    if (!role) return res.status(404).json({ error: 'Rol no trobat', code: 'NOT_FOUND' });

    await auditService.logAction(req.user._id, 'roles:update', req.params.id, 'role', updates, 'success', auditService.extractMeta(req));
    res.json(role);
  } catch (err) { next(err); }
};

/**
 * DELETE /api/roles/:id (soft delete)
 */
const deleteRole = async (req, res, next) => {
  try {
    const role = await Role.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!role) return res.status(404).json({ error: 'Rol no trobat', code: 'NOT_FOUND' });
    await auditService.logAction(req.user._id, 'roles:delete', req.params.id, 'role', null, 'success', auditService.extractMeta(req));
    res.json({ message: 'Rol eliminat correctament' });
  } catch (err) { next(err); }
};

/**
 * GET /api/roles/:id/hierarchy
 * Retorna la cadena completa de rols pare
 */
const getRoleHierarchy = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id).populate('parentRole');
    if (!role) return res.status(404).json({ error: 'Rol no trobat', code: 'NOT_FOUND' });

    const chain = [{ _id: role._id, name: role.name, level: role.level }];
    let current = role;
    const visited = new Set([String(role._id)]);

    while (current.parentRole) {
      if (visited.has(String(current.parentRole._id || current.parentRole))) break;
      current = await Role.findById(current.parentRole).populate('parentRole');
      if (!current) break;
      visited.add(String(current._id));
      chain.push({ _id: current._id, name: current.name, level: current.level });
    }

    res.json({ roleId: role._id, hierarchy: chain });
  } catch (err) { next(err); }
};

/**
 * GET /api/roles/:id/permissions
 * Retorna tots els permisos (propis + heretats via jerarquia)
 */
const getRolePermissions = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id).populate('permissions');
    if (!role) return res.status(404).json({ error: 'Rol no trobat', code: 'NOT_FOUND' });

    const ownPermissions = role.permissions.map(p => p.name);
    const allPermissions = await permissionService.getRolePermissions(req.params.id);
    const inherited = allPermissions.filter(p => !ownPermissions.includes(p));

    res.json({ roleId: role._id, roleName: role.name, ownPermissions, inheritedPermissions: inherited, allPermissions });
  } catch (err) { next(err); }
};

module.exports = { getRoles, getRoleById, createRole, updateRole, deleteRole, getRoleHierarchy, getRolePermissions };
