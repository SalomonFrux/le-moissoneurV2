const express = require('express');
const { runScraper, getScraperStatus, createScraper, getAllScrapers } = require('../controllers/scraperController');
const { getCompaniesWithTitles } = require('../controllers/companyController');

const router = express.Router();

// Get all scrapers
router.get('/', getAllScrapers);

// Create a new scraper
router.post('/', createScraper);

// Run a scraper
router.post('/run/:id', runScraper);

// Get scraper status
router.get('/status/:id', getScraperStatus);

// Get companies with their scraped data titles
router.get('/companies', getCompaniesWithTitles);

module.exports = router;