const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireLevel } = require('../middleware/roleMiddleware');

router.use(authenticate, requireLevel(4));

router.get('/logs', auditController.getLogs);
router.get('/stats', auditController.getStats);
router.get('/stats/user/:userId', auditController.getUserStats);
router.get('/export', auditController.exportLogs);

module.exports = router;
