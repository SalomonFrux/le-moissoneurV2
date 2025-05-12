const express = require('express');
const { runScraper, getScraperStatus, createScraper, getAllScrapers, getScraperData, exportToPdf, updateScraper } = require('../controllers/scraperController');
const { getCompaniesWithTitles } = require('../controllers/companyController');

const router = express.Router();

// Get all scrapers
router.get('/', getAllScrapers);

// Create a new scraper
router.post('/', createScraper);

// Update a scraper
router.put('/:id', updateScraper);

// Run a scraper
router.post('/run/:id', runScraper);

// Get scraper status
router.get('/status/:id', getScraperStatus);

// Get scraper data
router.get('/:id/data', getScraperData);

// Get companies with their scraped data titles
router.get('/companies', getCompaniesWithTitles);

// Export data to PDF
router.get('/export/pdf', exportToPdf);

module.exports = router;