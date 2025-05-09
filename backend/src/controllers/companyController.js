const { logger } = require('../utils/logger');
const { supabase } = require('../db/supabase');

/**
 * Get all companies with their scraped data entries
 */
async function getCompaniesWithTitles(req, res, next) {
  try {
    // First get all scraped data with their scraper information
    const { data: scrapedData, error: scrapedDataError } = await supabase
      .from('scraped_data')
      .select(`
        *,
        scraper:scraper_id (
          name,
          country
        )
      `);

    if (scrapedDataError) {
      logger.error(`Error fetching scraped data: ${scrapedDataError.message}`);
      return res.status(500).json({ error: scrapedDataError.message });
    }

    // Log the raw scraped data
    logger.info('Raw scraped data:', JSON.stringify(scrapedData, null, 2));

    // Get all companies
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*');

    if (companiesError) {
      logger.error(`Error fetching companies: ${companiesError.message}`);
      return res.status(500).json({ error: companiesError.message });
    }

    // Map companies with their scraped data
    const companiesWithScrapedData = companies.map(company => {
      // Find all scraped data entries for this company
      const matchingScrapedData = scrapedData.filter(entry => {
        // Try to parse the content to extract company information
        let contentData = {};
        try {
          contentData = JSON.parse(entry.content);
        } catch (e) {
          // If parsing fails, try to extract data from the raw content
          const content = entry.content || '';
          const websiteMatch = content.match(/Site web\s*:\s*([^\n]+)/i);
          const emailMatch = content.match(/E-mail\s*:\s*([^\n]+)/i);
          const phoneMatch = content.match(/Tel\s*:\s*([^\n]+)/i);
          const addressMatch = content.match(/Address\s*:\s*([^\n]+)/i);

          contentData = {
            website: websiteMatch ? websiteMatch[1].trim() : null,
            email: emailMatch ? emailMatch[1].trim() : null,
            phone: phoneMatch ? phoneMatch[1].trim() : null,
            address: addressMatch ? addressMatch[1].trim() : null
          };
        }

        // Match based on company name and scraper country
        return entry.scraper?.name === company.name && 
               entry.scraper?.country === company.country;
      });

      // Process each matching scraped data entry
      const scrapedEntries = matchingScrapedData.map(entry => {
        let contentData = {};
        try {
          contentData = JSON.parse(entry.content);
        } catch (e) {
          // If parsing fails, try to extract data from the raw content
          const content = entry.content || '';
          const websiteMatch = content.match(/Site web\s*:\s*([^\n]+)/i);
          const emailMatch = content.match(/E-mail\s*:\s*([^\n]+)/i);
          const phoneMatch = content.match(/Tel\s*:\s*([^\n]+)/i);
          const addressMatch = content.match(/Address\s*:\s*([^\n]+)/i);

          contentData = {
            website: websiteMatch ? websiteMatch[1].trim() : null,
            email: emailMatch ? emailMatch[1].trim() : null,
            phone: phoneMatch ? phoneMatch[1].trim() : null,
            address: addressMatch ? addressMatch[1].trim() : null
          };
        }

        return {
          ...entry,
          metadata: {
            ...contentData,
            ...entry.metadata
          }
        };
      });

      return {
        ...company,
        scraped_entries: scrapedEntries
      };
    });

    // Log the final response
    logger.info('Final response:', JSON.stringify(companiesWithScrapedData, null, 2));

    return res.status(200).json(companiesWithScrapedData);
  } catch (err) {
    logger.error(`Error in getCompaniesWithTitles: ${err.message}`);
    next(err);
  }
}

module.exports = {
  getCompaniesWithTitles
}; 