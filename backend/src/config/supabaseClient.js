const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
// Try using the service role key if available, otherwise fall back to regular key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration');
}

// Create client with additional options
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'x-my-custom-header': 'my-app-name',
    },
  },
});

// Test the connection and log any issues
const testConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { data: scrapers, error: scrapersError } = await supabase
      .from('scrapers')
      .select('count');
    
    console.log('Scrapers query result:', { data: scrapers, error: scrapersError });

    // Try to get scraped data count
    const { data: scrapedCount, error: scrapedError } = await supabase
      .from('scraped_data')
      .select('count');

    console.log('Scraped data count result:', { 
      data: scrapedCount,
      error: scrapedError
    });

    if (scrapersError || scrapedError) {
      console.error('Supabase connection test error(s):', { scrapersError, scrapedError });
    } else {
      console.log('Supabase connection test successful');
    }
  } catch (error) {
    console.error('Supabase connection test failed:', error);
  }
};

// Run the test
testConnection();

module.exports = {
  supabase
}; 