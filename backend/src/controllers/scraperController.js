const logger = require('../utils/logger');
const { supabase } = require('../db/supabase');
const { executeScraper } = require('../services/scraperService');
const scraperStatusHandler = require('../websocket/scraperStatusHandler');

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
        scraperStatusHandler.updateStatus(id, {
          status: 'completed',
          currentPage: 0,
          totalItems: 0,
          type: 'success',
          message: 'Scraping completed successfully'
        });
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

        scraperStatusHandler.updateStatus(id, {
          status: 'error',
          currentPage: 0,
          totalItems: 0,
          type: 'error',
          message: `Scraping failed: ${err.message}`,
          error: err.message
        });
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
 * Get a scraper by ID
 */
async function getScraperById(req, res, next) {
  const { id } = req.params; // Get the ID from the request parameters

  try {
    const { data, error } = await supabase
      .from('scrapers')
      .select('*')
      .eq('id', id) // Filter by the provided ID
      .single(); // Fetch a single record

    if (error) {
      logger.error(`Error fetching scraper with ID ${id}: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ message: 'Scraper not found' });
    }

    return res.status(200).json(data); // Return the scraper data
  } catch (err) {
    logger.error(`Error in getScraperById: ${err.message}`);
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

    // Return the data directly without transformation
    return res.status(200).json(data);
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

    // Transform the data to keep both scraper name and company name
    const transformedData = data.map(item => ({
      ...item,
      scraper_name: item.scraper?.name || '-',  // Keep scraper name separately
      company_name: item.nom || '-'  // Keep the original company name
    }));

    // Group the data by scraper name
    const groupedData = transformedData.reduce((acc, item) => {
      const scraperName = item.scraper_name;
      if (!acc[scraperName]) {
        acc[scraperName] = [];
      }
      acc[scraperName].push(item);
      return acc;
    }, {});

    res.json(Object.entries(groupedData).map(([scraperName, entries]) => ({
      scraper_name: scraperName,
      entries: entries
    })));
  } catch (error) {
    console.error('Error fetching all scraped data:', error);
    res.status(500).json({ error: error.message });
  }
}

// Update scraped data
const updateScrapedData = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const { data, error } = await supabase
      .from('scraped_data')
      .update({
        nom: updateData.nom,
        secteur: updateData.secteur,
        pays: updateData.pays,
        site_web: updateData.site_web,
        email: updateData.email,
        telephone: updateData.telephone,
        adresse: updateData.adresse,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating scraped data:', error);
      return res.status(500).json({ message: 'Internal server error', error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    res.json(data[0]);
  } catch (error) {
    console.error('Error updating scraped data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete scraped data
const deleteScrapedData = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('scraped_data')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error deleting scraped data:', error);
      return res.status(500).json({ message: 'Internal server error', error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    res.json({ message: 'Entry deleted successfully', data: data[0] });
  } catch (error) {
    console.error('Error deleting scraped data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const exportToPdf = async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=export-${new Date().toISOString()}.pdf`);

    doc.pipe(res);

    // Get all scraped data
    const { data: rows, error } = await supabase
      .from('scraped_data')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching data:', error);
      doc.text('Erreur lors de la récupération des données.');
      doc.end();
      return;
    }

    doc.fontSize(25).text('Données Extraites', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12);
    const headers = ['Nom', 'Secteur', 'Pays', 'Email', 'Téléphone', 'Adresse'];
    let y = doc.y;
    headers.forEach((header, i) => {
      doc.text(header, 50 + (i * 90), y);
    });
    doc.moveDown();

    (rows || []).forEach(entry => {
      y = doc.y;
      doc.text(entry.nom || '-', 50, y);
      doc.text(entry.secteur || '-', 140, y);
      doc.text(entry.pays || '-', 230, y);
      doc.text(entry.email || '-', 320, y);
      doc.text(entry.telephone || '-', 410, y);
      doc.text(entry.adresse || '-', 500, y);
      doc.moveDown();
      if (doc.y > 700) doc.addPage();
    });

    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

/**
 * Update a scraper
 */
async function updateScraper(req, res, next) {
  try {
    const { id } = req.params;
    const { name, source, selectors, frequency, type, country } = req.body;

    // First check if the scraper exists
    const { data: existingScraper, error: fetchError } = await supabase
      .from('scrapers')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingScraper) {
      logger.error(`Scraper with ID ${id} not found`);
      return res.status(404).json({ error: 'Scraper not found' });
    }

    // Update the scraper
    const { data, error } = await supabase
      .from('scrapers')
      .update({ 
        name, 
        source,
        selectors,
        frequency: frequency || existingScraper.frequency,
        type: type || existingScraper.type,
        country: country || existingScraper.country
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error(`Error updating scraper: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  } catch (err) {
    logger.error(`Error in updateScraper: ${err.message}`);
    next(err);
  }
}

/**
 * Delete a scraper
 */
async function deleteScraper(req, res, next) {
  try {
    const { id } = req.params;

    // First check if the scraper exists
    const { data: existingScraper, error: fetchError } = await supabase
      .from('scrapers')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingScraper) {
      logger.error(`Scraper with ID ${id} not found`);
      return res.status(404).json({ error: 'Scraper not found' });
    }

    // Delete associated scraped data first
    const { error: dataDeleteError } = await supabase
      .from('scraped_data')
      .delete()
      .eq('scraper_id', id);

    if (dataDeleteError) {
      logger.error(`Error deleting scraped data for scraper ${id}: ${dataDeleteError.message}`);
      return res.status(500).json({ error: 'Error deleting scraped data' });
    }

    // Delete the scraper
    const { error: scraperDeleteError } = await supabase
      .from('scrapers')
      .delete()
      .eq('id', id);

    if (scraperDeleteError) {
      logger.error(`Error deleting scraper ${id}: ${scraperDeleteError.message}`);
      return res.status(500).json({ error: 'Error deleting scraper' });
    }

    return res.status(200).json({ message: 'Scraper deleted successfully' });
  } catch (err) {
    logger.error(`Error in deleteScraper: ${err.message}`);
    next(err);
  }
}

module.exports = {
  getAllScrapers,
  createScraper,
  runScraper,
  getScraperStatus,
  getScraperData,
  getAllScrapedData,
  updateScrapedData,
  deleteScrapedData,
  exportToPdf,
  updateScraper,
  deleteScraper,
  getScraperById
};