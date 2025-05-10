const express = require('express');
const { 
  getAllScrapedData,
  updateScrapedData,
  deleteScrapedData
} = require('../controllers/scraperController');

const router = express.Router();

// Get all scraped data
router.get('/', getAllScrapedData);

// Update scraped data
router.put('/:id', updateScrapedData);

// Delete scraped data
router.delete('/:id', deleteScrapedData);

module.exports = router; 