const { supabase } = require('../config/supabaseClient');
const logger = require('../utils/logger');

/**
 * Get dashboard data
 */
async function getDashboardData(req, res) {
  try {
    logger.info('Starting getDashboardData...');

    // Get auth header from request
    const authHeader = req.headers.authorization;
    logger.info('Auth header present:', !!authHeader);

    // If we have an auth header, try to use it
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError) {
        logger.error('Auth error:', authError);
      } else {
        logger.info('Authenticated user:', user?.id);
      }
    }

    // First get scrapers to verify data exists
    const { data: scrapers, error: scrapersError } = await supabase
      .from('scrapers')
      .select('id, name, data_count');

    logger.info('Scrapers query result:', {
      hasData: !!scrapers,
      count: scrapers?.length,
      dataCounts: scrapers?.map(s => ({ name: s.name, count: s.data_count })),
      error: scrapersError
    });

    // Get all scraped data (limit to 10k for perf, adjust as needed)
    const { data: scrapedData, error: scrapedError } = await supabase
      .from('scraped_data')
      .select('*')
      .limit(10000);
    if (scrapedError) {
      logger.error('Error fetching scraped_data:', scrapedError);
    }

    // Helper to extract country from various possible places
    function extractCountry(item) {
      if (item.pays) return item.pays;
      if (item.country) return item.country;
      if (item.metadata && (item.metadata.country || item.metadata.pays)) {
        return item.metadata.country || item.metadata.pays;
      }
      if (item.content) {
        try {
          const parsed = typeof item.content === 'string' ? JSON.parse(item.content) : item.content;
          if (parsed && (parsed.country || parsed.pays)) return parsed.country || parsed.pays;
        } catch (e) {}
      }
      return null;
    }

    // Calculate unique countries
    const uniqueCountries = new Set(
      (scrapedData || [])
        .map(extractCountry)
        .filter(pays => pays && pays.trim() !== '' && pays !== 'Aucune donnée')
    ).size;

    // Calculate total entries
    const totalEntries = scrapedData?.length || 0;

    // Calculate sources count - only count active scrapers with data
    const sourcesCount = scrapers?.filter(s => s.data_count > 0)?.length || 0;

    // Calculate enrichment rate
    let enrichmentRate = 0;
    if (sourcesCount > 0) {
      enrichmentRate = parseFloat(((totalEntries / sourcesCount) * 100).toFixed(2));
    }

    // Create stats using the best available data
    const stats = {
      totalEntries,
      uniqueCountries,
      sourcesCount,
      enrichmentRate
    };

    // Log final results
    logger.info('Final calculated stats:', stats);

    // Send response
    res.json({ 
      stats,
      _debug: {
        scrapersCount: scrapers?.length,
        totalEntries,
        uniqueCountries,
        sourcesCount,
        enrichmentRate,
        hasAuth: !!authHeader
      }
    });

  } catch (error) {
    logger.error('Error in getDashboardData:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

// Add RPC function for direct count
const rpcSQL = `
CREATE OR REPLACE FUNCTION get_total_records()
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM scraped_data);
END;
$$ LANGUAGE plpgsql;
`;

// Add this function to test the connection
async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('scraped_data')
      .select('count')
      .single();
    
    if (error) {
      logger.error('Supabase connection test error:', error);
      return false;
    }
    
    logger.info('Supabase connection test successful');
    return true;
  } catch (error) {
    logger.error('Supabase connection test failed:', error);
    return false;
  }
}

async function getDebugData(req, res) {
  try {
    // Test connection first
    const isConnected = await testSupabaseConnection();
    
    // Log Supabase client details (without sensitive info)
    logger.info('Supabase client config:', {
      url: supabase.supabaseUrl,
      hasKey: !!supabase.supabaseKey,
    });

    // Try different query approaches
    const basicQuery = await supabase
      .from('scraped_data')
      .select('*');

    const countQuery = await supabase
      .from('scraped_data')
      .select('*', { count: 'exact', head: true });

    const scrapersQuery = await supabase
      .from('scrapers')
      .select('*');

    // Try with explicit schema
    const schemaQuery = await supabase
      .schema('public')
      .from('scraped_data')
      .select('*');

    // Try a simpler query with just one column
    const simpleQuery = await supabase
      .from('scraped_data')
      .select('id');

    // Try with a range query
    const rangeQuery = await supabase
      .from('scraped_data')
      .select('*')
      .range(0, 9);

    // Log detailed results with full error information
    logger.info('Basic query result:', {
      hasData: !!basicQuery.data,
      count: basicQuery.data?.length,
      error: basicQuery.error,
      status: basicQuery.status,
      statusText: basicQuery.statusText
    });

    logger.info('Count query result:', {
      count: countQuery.count,
      error: countQuery.error,
      status: countQuery.status,
      statusText: countQuery.statusText
    });

    logger.info('Scrapers query result:', {
      hasData: !!scrapersQuery.data,
      count: scrapersQuery.data?.length,
      error: scrapersQuery.error,
      status: scrapersQuery.status,
      statusText: scrapersQuery.statusText
    });

    logger.info('Schema query result:', {
      hasData: !!schemaQuery.data,
      count: schemaQuery.data?.length,
      error: schemaQuery.error,
      status: schemaQuery.status,
      statusText: schemaQuery.statusText
    });

    logger.info('Simple query result:', {
      hasData: !!simpleQuery.data,
      count: simpleQuery.data?.length,
      error: simpleQuery.error,
      status: simpleQuery.status,
      statusText: simpleQuery.statusText
    });

    logger.info('Range query result:', {
      hasData: !!rangeQuery.data,
      count: rangeQuery.data?.length,
      error: rangeQuery.error,
      status: rangeQuery.status,
      statusText: rangeQuery.statusText
    });

    res.json({
      connection_test: isConnected,
      supabase_config: {
        hasUrl: !!supabase.supabaseUrl,
        hasKey: !!supabase.supabaseKey,
      },
      queries: {
        basic: {
          data: basicQuery.data,
          error: basicQuery.error,
          count: basicQuery.data?.length || 0,
          status: basicQuery.status,
          statusText: basicQuery.statusText
        },
        count: {
          count: countQuery.count,
          error: countQuery.error,
          status: countQuery.status,
          statusText: countQuery.statusText
        },
        scrapers: {
          data: scrapersQuery.data,
          error: scrapersQuery.error,
          count: scrapersQuery.data?.length || 0,
          status: scrapersQuery.status,
          statusText: scrapersQuery.statusText
        },
        schema: {
          data: schemaQuery.data,
          error: schemaQuery.error,
          count: schemaQuery.data?.length || 0,
          status: schemaQuery.status,
          statusText: schemaQuery.statusText
        },
        simple: {
          data: simpleQuery.data,
          error: simpleQuery.error,
          count: simpleQuery.data?.length || 0,
          status: simpleQuery.status,
          statusText: simpleQuery.statusText
        },
        range: {
          data: rangeQuery.data,
          error: rangeQuery.error,
          count: rangeQuery.data?.length || 0,
          status: rangeQuery.status,
          statusText: rangeQuery.statusText
        }
      }
    });
  } catch (error) {
    logger.error('Debug endpoint error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

module.exports = {
  getDashboardData,
  getDebugData
};