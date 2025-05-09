const { logger } = require('../utils/logger');
const { supabase } = require('../db/supabase');
const { executeScraper } = require('../services/scraperService');

/**
 * Run a scraper by ID
 */
async function runScraper(req, res, next) {
  try {
    const { id } = req.params;
    
    // Get scraper details from Supabase
    const { data: scraper, error } = await supabase
      .from('scrapers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      logger.error(`Error fetching scraper with ID ${id}: ${error.message}`);
      return res.status(404).json({ 
        error: `Scraper with ID ${id} not found`,
        details: error.message 
      });
    }
    
    // Update scraper status to 'running'
    await supabase
      .from('scrapers')
      .update({ status: 'running' })
      .eq('id', id);
    
    // Start scraper execution asynchronously (don't await)
    executeScraper(scraper)
      .then(() => {
        logger.info(`Scraper ${id} completed successfully`);
      })
      .catch((err) => {
        logger.error(`Error running scraper ${id}: ${err.message}`);
        // Update status to error on failure
        supabase
          .from('scrapers')
          .update({ 
            status: 'error',
            last_run: new Date().toISOString()
          })
          .eq('id', id);
      });
    
    // Immediately respond that the scraper has started
    return res.status(202).json({
      message: `Scraper ${id} has been started`,
      scraper: {
        id: scraper.id,
        name: scraper.name,
        status: 'running'
      }
    });
  } catch (err) {
    logger.error(`Error in runScraper: ${err.message}`);
    next(err);
  }
}

/**
 * Get the current status of a scraper
 */
async function getScraperStatus(req, res, next) {
  try {
    const { id } = req.params;
    
    const { data: scraper, error } = await supabase
      .from('scrapers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      logger.error(`Error fetching scraper status for ID ${id}: ${error.message}`);
      return res.status(404).json({ 
        error: `Scraper with ID ${id} not found`,
        details: error.message 
      });
    }
    
    return res.status(200).json(scraper);
  } catch (err) {
    logger.error(`Error in getScraperStatus: ${err.message}`);
    next(err);
  }
}

/**
 * Get all scrapers
 */
async function getAllScrapers(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('scrapers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error(`Error fetching scrapers: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  } catch (err) {
    logger.error(`Error in getAllScrapers: ${err.message}`);
    next(err);
  }
}

/**
 * Create a new scraper
 */
async function createScraper(req, res, next) {
  try {
    const { name, source, selectors, frequency, type, country } = req.body;

    if (!name || !source) {
      return res.status(400).json({ 
        error: 'Name and source URL are required' 
      });
    }

    const { data, error } = await supabase
      .from('scrapers')
      .insert([{ 
        name, 
        source,
        selectors,
        frequency: frequency || 'manual',
        status: 'idle',
        data_count: 0,
        type: type || 'playwright', // Default to Playwright
        country: country || 'Unknown' // Include the country field
      }])
      .select()
      .single();

    if (error) {
      logger.error(`Error creating scraper: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(data);
  } catch (err) {
    logger.error(`Error in createScraper: ${err.message}`);
    next(err);
  }
}

module.exports = {
  getAllScrapers,
  createScraper,
  runScraper,
  getScraperStatus
};