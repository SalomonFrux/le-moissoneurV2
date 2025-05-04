const express = require('express');
const { runScraper, getScraperStatus, createScraper, getAllScrapers } = require('../controllers/scraperController');

const router = express.Router();

// Get all scrapers
router.get('/', getAllScrapers);

// Create a new scraper
router.post('/', createScraper);

// Run a scraper
router.post('/run/:id', runScraper);

// Get scraper status
router.get('/status/:id', getScraperStatus);

module.exports = router;