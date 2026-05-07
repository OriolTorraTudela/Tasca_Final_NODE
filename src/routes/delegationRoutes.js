const express = require('express');
const router = express.Router();
const delegationController = require('../controllers/delegationController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireLevel } = require('../middleware/roleMiddleware');
const { delegationValidators, validate } = require('../utils/validators');

router.use(authenticate);

router.get('/', delegationController.getDelegations);
router.get('/user/:userId', delegationController.getDelegationsByUser);
router.get('/:id', delegationController.getDelegationById);
router.post('/', requireLevel(3), delegationValidators, validate, delegationController.createDelegation);
router.put('/:id', requireLevel(3), delegationController.updateDelegation);
router.delete('/:id', requireLevel(3), delegationController.deleteDelegation);

module.exports = router;
