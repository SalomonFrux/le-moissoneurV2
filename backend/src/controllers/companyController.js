const { logger } = require('../utils/logger');
const { supabase } = require('../db/supabase');

/**
 * Get all companies with their scraped data titles
 */
async function getCompaniesWithTitles(req, res, next) {
  try {
    // Get all companies with their associated scraper names
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select(`
        *,
        scraper:scrapers!inner (
          name
        )
      `)
      .eq('scrapers.source', 'companies.source');

    if (companiesError) {
      logger.error(`Error fetching companies: ${companiesError.message}`);
      return res.status(500).json({ error: companiesError.message });
    }

    // Map the companies to include the scraper name
    const companiesWithScraperNames = companies.map(company => ({
      ...company,
      title: company.scraper?.name || company.source
    }));

    return res.status(200).json(companiesWithScraperNames);
  } catch (err) {
    logger.error(`Error in getCompaniesWithTitles: ${err.message}`);
    next(err);
  }
}

module.exports = {
  getCompaniesWithTitles
}; 