const express = require('express');
const router = express.Router();
const { getDashboard, getUtilization } = require('../controllers/analytics.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

router.get('/dashboard', authenticate, requireAdmin, getDashboard);
router.get('/utilization', authenticate, requireAdmin, getUtilization);

module.exports = router;