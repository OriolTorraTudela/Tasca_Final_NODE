const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireLevel } = require('../middleware/roleMiddleware');
const { permissionValidators, validate } = require('../utils/validators');

router.use(authenticate);

router.get('/', permissionController.getPermissions);
router.get('/:id', permissionController.getPermissionById);
router.post('/', requireLevel(4), permissionValidators, validate, permissionController.createPermission);
router.put('/:id', requireLevel(4), permissionController.updatePermission);
router.delete('/:id', requireLevel(4), permissionController.deletePermission);

module.exports = router;
