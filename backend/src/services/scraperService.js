const puppeteer = require('puppeteer');
const { logger } = require('../utils/logger');
const { supabase } = require('../db/supabase');
const { genericScraper } = require('../scrapers/genericScraper');
const { newsPortalScraper } = require('../scrapers/newsPortalScraper');

/**
 * Execute a scraper based on its configuration
 */
async function executeScraper(scraper) {
  logger.info(`Starting scraper: ${scraper.name} (${scraper.id})`);
  
  try {
    // Launch browser
    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    let scrapedData = [];
    
    try {
      // Determine which scraper implementation to use
      // You can expand this with different scraper types
      if (scraper.type === 'news') {
        scrapedData = await newsPortalScraper(browser, scraper);
      } else {
        // Default to generic scraper
        scrapedData = await genericScraper(browser, scraper);
      }
      
      // Store results in Supabase
      if (scrapedData.length > 0) {
        // Prepare data for insertion
        const dataToInsert = scrapedData.map(item => ({
          scraper_id: scraper.id,
          title: item.title || null,
          content: item.content || null,
          url: item.url || scraper.url || null,
          metadata: item.metadata || {},
          scraped_at: new Date().toISOString()
        }));
        
        // Insert data
        const { error: insertError } = await supabase
          .from('scraped_data')
          .insert(dataToInsert);
        
        if (insertError) {
          throw new Error(`Failed to store scraped data: ${insertError.message}`);
        }
        
        logger.info(`Stored ${dataToInsert.length} items for scraper ${scraper.id}`);
      } else {
        logger.warn(`No data scraped for ${scraper.id}`);
      }
      
      // Update scraper status to success
      await supabase
        .from('scrapers')
        .update({ 
          status: 'active', 
          last_run: new Date().toISOString() 
        })
        .eq('id', scraper.id);
      
    } finally {
      // Always close the browser
      await browser.close();
    }
    
    return scrapedData;
  } catch (error) {
    logger.error(`Error executing scraper ${scraper.id}: ${error.message}`);
    
    // Update scraper status to error
    await supabase
      .from('scrapers')
      .update({ 
        status: 'error', 
        last_run: new Date().toISOString() 
      })
      .eq('id', scraper.id);
    
    throw error;
  }
}

module.exports = {
  executeScraper
};