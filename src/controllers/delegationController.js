const DelegatedPermission = require('../models/DelegatedPermission');
const delegationService = require('../services/delegationService');

/**
 * GET /api/delegations
 */
const getDelegations = async (req, res, next) => {
  try {
    const delegations = await DelegatedPermission.find()
      .populate('fromUserId', 'email firstName lastName')
      .populate('toUserId', 'email firstName lastName')
      .sort('-delegatedAt');
    res.json({ delegations, total: delegations.length });
  } catch (err) { next(err); }
};

/**
 * GET /api/delegations/:id
 */
const getDelegationById = async (req, res, next) => {
  try {
    const delegation = await DelegatedPermission.findById(req.params.id)
      .populate('fromUserId', 'email firstName lastName')
      .populate('toUserId', 'email firstName lastName');
    if (!delegation) return res.status(404).json({ error: 'Delegació no trobada', code: 'NOT_FOUND' });
    res.json(delegation);
  } catch (err) { next(err); }
};

/**
 * POST /api/delegations
 */
const createDelegation = async (req, res, next) => {
  try {
    const delegation = await delegationService.createDelegation(req.user._id, req.body);
    res.status(201).json(delegation);
  } catch (err) { next(err); }
};

/**
 * PUT /api/delegations/:id (actualitzar motiu, etc.)
 */
const updateDelegation = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const delegation = await DelegatedPermission.findByIdAndUpdate(
      req.params.id, { reason }, { new: true }
    );
    if (!delegation) return res.status(404).json({ error: 'Delegació no trobada', code: 'NOT_FOUND' });
    res.json(delegation);
  } catch (err) { next(err); }
};

/**
 * DELETE /api/delegations/:id (revocar)
 */
const deleteDelegation = async (req, res, next) => {
  try {
    const delegation = await delegationService.revokeDelegation(req.params.id, req.user._id);
    res.json({ message: 'Delegació revocada correctament', delegation });
  } catch (err) { next(err); }
};

/**
 * GET /api/delegations/user/:userId
 */
const getDelegationsByUser = async (req, res, next) => {
  try {
    const delegations = await DelegatedPermission.find({
      $or: [{ fromUserId: req.params.userId }, { toUserId: req.params.userId }]
    })
      .populate('fromUserId', 'email firstName lastName')
      .populate('toUserId', 'email firstName lastName')
      .sort('-delegatedAt');
    res.json({ delegations, total: delegations.length });
  } catch (err) { next(err); }
};

module.exports = { getDelegations, getDelegationById, createDelegation, updateDelegation, deleteDelegation, getDelegationsByUser };
