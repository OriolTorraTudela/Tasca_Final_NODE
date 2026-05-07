const DelegatedPermission = require('../models/DelegatedPermission');
const auditService = require('./auditService');

/**
 * Crea una delegació de permís temporal d'un usuari a un altre
 */
const createDelegation = async (fromUserId, { toUserId, permission, reason, daysValid }) => {
  if (!daysValid || daysValid <= 0) {
    const err = new Error('daysValid ha de ser un nombre positiu');
    err.statusCode = 400;
    throw err;
  }

  const expiresAt = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000);

  const delegation = await DelegatedPermission.create({
    fromUserId,
    toUserId,
    permission,
    reason,
    expiresAt,
    status: 'active',
  });

  await auditService.logAction(
    fromUserId,
    'permission:delegate',
    String(toUserId),
    'user',
    { permission, daysValid },
    'success'
  );

  return delegation;
};

/**
 * Revoca (esborra lògicament) una delegació
 */
const revokeDelegation = async (delegationId, requestUserId) => {
  const delegation = await DelegatedPermission.findById(delegationId);
  if (!delegation) {
    const err = new Error('Delegació no trobada');
    err.statusCode = 404;
    throw err;
  }

  delegation.status = 'revoked';
  delegation.revokedAt = new Date();
  await delegation.save();

  await auditService.logAction(
    requestUserId,
    'permission:revoke',
    String(delegationId),
    'delegation',
    { permission: delegation.permission },
    'success'
  );

  return delegation;
};

/**
 * Marca com a expirades les delegacions passades (cron job helper)
 */
const expireOldDelegations = async () => {
  const result = await DelegatedPermission.updateMany(
    { status: 'active', expiresAt: { $lt: new Date() } },
    { $set: { status: 'expired' } }
  );
  return result.modifiedCount;
};

module.exports = { createDelegation, revokeDelegation, expireOldDelegations };
