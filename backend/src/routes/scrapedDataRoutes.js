const express = require('express');
const { getAllScrapedData } = require('../controllers/scraperController');

const router = express.Router();

// Get all scraped data
router.get('/', getAllScrapedData);

module.exports = router; 