const { supabase } = require('../config/supabaseClient');
const logger = require('../utils/logger');

/**
 * Get dashboard data
 */
async function getDashboardData(req, res) {
  try {
    const { page = 1, pageSize = 4 } = req.query;
    const offset = (page - 1) * pageSize;

    // Get total counts
    const [scraperCount, dataCount] = await Promise.all([
      supabase.from('scrapers').select('id', { count: 'exact' }),
      supabase.from('scraped_data').select('id', { count: 'exact' })
    ]);

    // Get recent scraped data
    const { data: recentData, error: recentError } = await supabase
      .from('scraped_data')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (recentError) {
      logger.error('Error fetching recent data:', recentError);
      return res.status(500).json({ error: 'Error fetching dashboard data' });
    }

    // Get active scrapers
    const { data: activeScrapers, error: activeError } = await supabase
      .from('scrapers')
      .select('*')
      .eq('status', 'running');

    if (activeError) {
      logger.error('Error fetching active scrapers:', activeError);
      return res.status(500).json({ error: 'Error fetching dashboard data' });
    }

    res.json({
      totalScrapers: scraperCount.count,
      totalData: dataCount.count,
      recentData,
      activeScrapers: activeScrapers || [],
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(dataCount.count / pageSize)
      }
    });
  } catch (error) {
    logger.error('Error in getDashboardData:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  getDashboardData
}; 