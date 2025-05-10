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

/**
 * Get scraped data for a specific scraper
 */
async function getScraperData(req, res, next) {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('scraped_data')
      .select('*')
      .eq('scraper_id', id)
      .order('created_at', { ascending: false });
    
    if (error) {
      logger.error(`Error fetching scraped data for scraper ${id}: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }

    // Process and structure the data
    const processedData = data.map(item => {
      let structuredData = {
        id: item.id,
        scraper_id: item.scraper_id,
        nom: item.nom,
        created_at: item.created_at,
        updated_at: item.updated_at
      };

      // Extract data from contenu using regex
      if (item.contenu) {
        const content = item.contenu;
        
        // Extract address
        const addressMatch = content.match(/Address\s*:\s*([^\n]+)/i);
        const address = addressMatch ? addressMatch[1].trim() : '';
        
        // Extract phone
        const phoneMatch = content.match(/Tel\s*:\s*([^\n]+)/i);
        const phone = phoneMatch ? phoneMatch[1].trim() : '';
        
        // Extract fax
        const faxMatch = content.match(/Fax\s*:\s*([^\n]+)/i);
        const fax = faxMatch ? faxMatch[1].trim() : '';
        
        // Extract email
        const emailMatch = content.match(/E-mail\s*:\s*([^\n]+)/i);
        const email = emailMatch ? emailMatch[1].trim() : '';
        
        // Extract website if present
        const websiteMatch = content.match(/Site web\s*:\s*([^\n]+)/i);
        const website = websiteMatch ? websiteMatch[1].trim() : '';

        // Extract city from address
        const cityMatch = address.match(/\s*-\s*([^-]+)$/);
        const city = cityMatch ? cityMatch[1].trim() : '';

        // Update structured data with extracted information
        structuredData = {
          ...structuredData,
          adresse: address,
          telephone: phone,
          email: email,
          site_web: website,
          pays: 'Maroc', // Default to Morocco since all addresses are in Morocco
          ville: city,
          secteur: item.secteur || 'Non spécifié',
          metadata: {
            ...item.metadata,
            fax: fax
          }
        };
      }

      return structuredData;
    });
    
    return res.status(200).json(processedData);
  } catch (err) {
    logger.error(`Error in getScraperData: ${err.message}`);
    next(err);
  }
}

// Helper function to extract information using regex
function extractInfo(text, pattern) {
  const match = text?.match(pattern);
  return match ? match[1].trim() : '';
}

async function getAllScrapedData(req, res) {
  try {
    const { data, error } = await supabase
      .from('scraped_data')
      .select(`
        *,
        scraper:scrapers(name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform the data to include scraper name
    const transformedData = data.map(item => ({
      ...item,
      nom: item.scraper?.name || '-'
    }));

    res.json(transformedData);
  } catch (error) {
    console.error('Error fetching all scraped data:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAllScrapers,
  createScraper,
  runScraper,
  getScraperStatus,
  getScraperData,
  getAllScrapedData
};