const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireLevel } = require('../middleware/roleMiddleware');

router.use(authenticate);

router.get('/', requireLevel(4), userController.getUsers);
router.get('/:id/permissions', userController.getUserPermissions);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', requireLevel(4), userController.deleteUser);

module.exports = router;
