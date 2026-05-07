/**
 * Constants globals del sistema: jerarquia de rols i límits de rate limiting
 */

const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
  VIEWER: 'viewer',
};

// Nivells jeràrquics (com més alt, més permisos)
const ROLE_LEVELS = {
  [ROLES.VIEWER]: 1,
  [ROLES.USER]: 2,
  [ROLES.MANAGER]: 3,
  [ROLES.ADMIN]: 4,
  [ROLES.SUPER_ADMIN]: 5,
};

// Límits de peticions per minut per rol
const RATE_LIMITS = {
  [ROLES.SUPER_ADMIN]: 1000,
  [ROLES.ADMIN]: 500,
  [ROLES.MANAGER]: 200,
  [ROLES.USER]: 100,
  [ROLES.VIEWER]: 50,
  default: 30,
};

const TASK_STATUS = ['pending', 'in_progress', 'completed', 'cancelled'];
const TASK_PRIORITY = ['low', 'medium', 'high', 'urgent'];
const DELEGATION_STATUS = ['active', 'expired', 'revoked'];

module.exports = { ROLES, ROLE_LEVELS, RATE_LIMITS, TASK_STATUS, TASK_PRIORITY, DELEGATION_STATUS };
