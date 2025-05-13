const express = require('express');
const { getDashboardData, getDebugData } = require('../controllers/dashboardController');

const router = express.Router();

// Get dashboard data
router.get('/', getDashboardData);
router.get('/debug', getDebugData);

module.exports = router; 