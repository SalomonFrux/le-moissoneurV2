const express = require('express');
const { runScraper, getScraperStatus } = require('../controllers/scraperController');

const router = express.Router();

// Route to run a scraper
router.post('/run/:id', runScraper);

// Route to check scraper status
router.get('/status/:id', getScraperStatus);

module.exports = router;