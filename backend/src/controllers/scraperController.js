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
      .select('id, name, status, last_run')
      .eq('id', id)
      .single();
    
    if (error) {
      logger.error(`Error fetching scraper status for ID ${id}: ${error.message}`);
      return res.status(404).json({ 
        error: `Scraper with ID ${id} not found`,
        details: error.message 
      });
    }
    
    return res.status(200).json({ scraper });
  } catch (err) {
    logger.error(`Error in getScraperStatus: ${err.message}`);
    next(err);
  }
}

module.exports = {
  runScraper,
  getScraperStatus
};