const Role = require('../models/Role');
const DelegatedPermission = require('../models/DelegatedPermission');

/**
 * Resol recursivament tots els permisos d'un rol (propis + heretats)
 * @param {string|ObjectId} roleId
 * @param {Set} visited - evita cicles infinits
 * @returns {string[]} array de noms de permisos únics
 */
const getRolePermissions = async (roleId, visited = new Set()) => {
  if (!roleId || visited.has(String(roleId))) return [];
  visited.add(String(roleId));

  const role = await Role.findById(roleId).populate('permissions');
  if (!role) return [];

  const ownPermissions = role.permissions.map(p => p.name);

  let inherited = [];
  if (role.parentRole) {
    inherited = await getRolePermissions(role.parentRole, visited);
  }

  // Deduplicació
  return [...new Set([...ownPermissions, ...inherited])];
};

/**
 * Retorna tots els permisos actius delegats a un usuari
 * @param {string} userId
 * @returns {string[]}
 */
const getActiveDelegations = async (userId) => {
  const now = new Date();
  const delegations = await DelegatedPermission.find({
    toUserId: userId,
    status: 'active',
    expiresAt: { $gt: now },
  });
  return delegations.map(d => d.permission);
};

/**
 * Comprova si un usuari té un permís concret (via rol o delegació)
 * @param {object} user - usuari amb rol populat
 * @param {string} permission
 */
const userHasPermission = async (user, permission) => {
  const rolePerms = await getRolePermissions(user.role);
  if (rolePerms.includes(permission)) return true;

  const delegated = await getActiveDelegations(String(user._id));
  return delegated.includes(permission);
};

module.exports = { getRolePermissions, getActiveDelegations, userHasPermission };
