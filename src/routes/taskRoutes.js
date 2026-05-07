const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticate } = require('../middleware/authMiddleware');
const { roleLimiter } = require('../middleware/rateLimiter');
const { taskValidators, validate } = require('../utils/validators');

router.use(authenticate);
router.use(roleLimiter);

router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTaskById);
router.post('/', taskValidators, validate, taskController.createTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
