const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireLevel } = require('../middleware/roleMiddleware');
const { roleValidators, validate } = require('../utils/validators');

router.use(authenticate);

router.get('/', roleController.getRoles);
router.get('/:id/hierarchy', roleController.getRoleHierarchy);
router.get('/:id/permissions', roleController.getRolePermissions);
router.get('/:id', roleController.getRoleById);
router.post('/', requireLevel(4), roleValidators, validate, roleController.createRole);
router.put('/:id', requireLevel(4), roleController.updateRole);
router.delete('/:id', requireLevel(4), roleController.deleteRole);

module.exports = router;
