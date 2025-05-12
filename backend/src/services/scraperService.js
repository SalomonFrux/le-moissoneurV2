const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const { logger } = require('../utils/logger');
const { supabase } = require('../db/supabase');
const { genericScraper } = require('../scrapers/genericScraper');
const { newsPortalScraper } = require('../scrapers/newsPortalScraper');
const { playwrightScraper } = require('../scrapers/playwrightScraper');

// Configuration
const MAX_RETRIES = 3;
const INITIAL_DELAY = 3000;
const MAX_DELAY = 30000;
const MAX_CONCURRENT_PAGES = 2;

let lastRequestTime = 0;
const activeRequests = new Set();

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < INITIAL_DELAY) {
    await sleep(INITIAL_DELAY - timeSinceLastRequest);
  }
  
  lastRequestTime = Date.now();
}

async function withRetry(operation, maxRetries = MAX_RETRIES) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Rate limiting
      await waitForRateLimit();
      
      return await operation();
    } catch (error) {
      lastError = error;
      
      const isRetryableError = 
        error.message.includes('socket hang up') ||
        error.message.includes('net::') ||
        error.message.includes('Protocol error') ||
        error.message.includes('Target closed') ||
        error.message.includes('Connection closed') ||
        error.message.includes('ERR_CONNECTION_RESET') ||
        error.message.includes('ERR_CONNECTION_REFUSED') ||
        error.message.includes('ERR_EMPTY_RESPONSE');
      
      if (!isRetryableError) throw error;
      
      if (attempt < maxRetries) {
        const delay = Math.min(
          INITIAL_DELAY * Math.pow(2, attempt - 1) + Math.random() * 1000,
          MAX_DELAY
        );
        
        logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms: ${error.message}`);
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}

async function createBrowserInstance() {
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--window-size=1920x1080',
    '--no-first-run',
    '--no-zygote',
    '--disable-extensions',
    '--disable-component-extensions-with-background-pages',
    '--disable-background-networking',
    '--disable-sync',
    '--metrics-recording-only',
    '--disable-default-apps',
    '--mute-audio',
    '--no-default-browser-check',
    '--disable-blink-features=AutomationControlled',
    '--disable-http2',
    '--host-resolver-rules="MAP * ~NOTFOUND, EXCLUDE localhost"',
    '--disable-features=site-per-process,TranslateUI',
    '--disable-client-side-phishing-detection',
    '--disable-component-update',
    '--disable-domain-reliability',
    '--disable-breakpad',
    '--disable-ipc-flooding-protection'
  ];

  // Wait for concurrent requests limit
  while (activeRequests.size >= MAX_CONCURRENT_PAGES) {
    await sleep(1000);
  }

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args,
      ignoreHTTPSErrors: true,
      defaultViewport: {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false
      },
      timeout: 60000,
      protocolTimeout: 60000
    });

    browser.on('disconnected', () => {
      activeRequests.delete(browser);
    });

    activeRequests.add(browser);
    return browser;
  } catch (error) {
    logger.error(`Failed to create browser instance: ${error.message}`);
    throw error;
  }
}

async function executeScraper(scraper) {
  logger.info(`Starting scraper: ${scraper.name} (${scraper.id})`);
  
  let browser;
  let scrapedData = [];
  
  try {
    await withRetry(async () => {
      // Use Playwright if type is 'playwright'
      if (scraper.type === 'playwright') {
        scrapedData = await playwrightScraper(
          scraper.source || scraper.url,
          {
            main: scraper.selectors?.main,
            child: scraper.selectors?.child || {},
            pagination: scraper.selectors?.pagination,
            dropdownClick: scraper.selectors?.dropdownClick
          }
        );
        
        // Map Playwright results to expected format
        scrapedData = scrapedData.map(result => ({
          title: scraper.name,
          content: result.text,
          url: scraper.source || scraper.url,
          metadata: result.metadata || {}
        }));
        return;
      }
      browser = await createBrowserInstance();
      const scrapeOperation = async () => {
        if (scraper.type === 'news') {
          return await newsPortalScraper(browser, scraper);
        } else {
          return await genericScraper(browser, scraper);
        }
      };
      scrapedData = await scrapeOperation();
    });

    if (scrapedData.length > 0) {
      const dataToInsert = scrapedData.map(item => {
        // Extract data from metadata and content
        const metadata = item.metadata || {};
        const content = item.content || '';
        
        // Helper function to extract data from content if not in metadata
        const extractFromContent = (pattern) => {
          if (typeof content === 'string') {
            const match = content.match(new RegExp(pattern, 'i'));
            return match ? match[1].trim() : 'Aucune donnée';
          }
          return 'Aucune donnée';
        };

        // Prioritize metadata values, fallback to content extraction, then default value
        const extractedData = {
          name: (() => {
            // First try to get from metadata
            if (metadata.name && metadata.name !== 'Aucune donnée') return metadata.name;
            // Then try to get from content's first line
            if (typeof content === 'string') {
              const firstLine = content.split('\n')[0].trim();
              if (firstLine && firstLine !== 'Aucune donnée') return firstLine;
            }
            // Then try pattern matching
            const nameFromPattern = extractFromContent(/Nom\s*:\s*([^\n]+)/i);
            if (nameFromPattern && nameFromPattern !== 'Aucune donnée') return nameFromPattern;
            // Finally use title or default
            return item.title || 'Aucune donnée';
          })(),
          phone: (() => {
            if (metadata.phone && metadata.phone !== 'Aucune donnée') return metadata.phone;
            // Look for phone-like patterns in content
            if (typeof content === 'string') {
              const phoneMatch = content.match(/(?:\+?\d{1,3}[-\s]?)?\d{2}[-\s]?\d{2}[-\s]?\d{2}[-\s]?\d{2}/);
              if (phoneMatch) return phoneMatch[0].trim();
            }
            return extractFromContent(/(?:Téléphone|Tel)\s*:\s*([^\n]+)/i) || 'Aucune donnée';
          })(),
          email: metadata.email || extractFromContent(/(?:E-mail|Email)\s*:\s*([^\n]+)/i) || 'Aucune donnée',
          website: metadata.website || extractFromContent(/(?:Site\s*Web|Website)\s*:\s*([^\n]+)/i) || 'Aucune donnée',
          address: (() => {
            if (metadata.address && metadata.address !== 'Aucune donnée') return metadata.address;
            // Look for address in content (after the first line, before phone/email)
            if (typeof content === 'string') {
              const lines = content.split('\n');
              if (lines.length > 1) {
                const addressLine = lines[1].trim();
                if (addressLine && !addressLine.match(/^(?:Tel|Email|Site)/i)) return addressLine;
              }
            }
            return extractFromContent(/(?:Adresse|Address)\s*:\s*([^\n]+)/i) || 'Aucune donnée';
          })(),
          sector: (() => {
            // First try to get from metadata (this will include the category from selectors)
            if (metadata.category && metadata.category !== 'Aucune donnée') return metadata.category;
            if (metadata.sector && metadata.sector !== 'Aucune donnée') return metadata.sector;
            return extractFromContent(/(?:Secteur|Sector)\s*:\s*([^\n]+)/i) || 'Aucune donnée';
          })()
        };

        // Clean up website URL if it exists and isn't already formatted
        if (extractedData.website && extractedData.website !== 'Aucune donnée' && !extractedData.website.toLowerCase().startsWith('http')) {
          extractedData.website = `https://${extractedData.website}`;
        }

        return {
          scraper_id: scraper.id,
          nom: extractedData.name,
          secteur: extractedData.sector || scraper.sector || 'Aucune donnée',
          pays: scraper.country || 'Maroc',
          site_web: extractedData.website,
          email: extractedData.email,
          telephone: extractedData.phone,
          adresse: extractedData.address,
          contenu: item.content, // Keep original content
          lien: item.url || scraper.source || null,
          metadata: {
            ...metadata,
            original_content: item.content,
            extracted_data: extractedData
          },
          created_at: new Date().toISOString()
        };
      });

      await withRetry(async () => {
        const { error: insertError } = await supabase
          .from('scraped_data')
          .insert(dataToInsert);

        if (insertError) {
          throw new Error(`Failed to store scraped data: ${insertError.message}`);
        }
      });

      // Extract and insert company data
      for (const item of scrapedData) {
        let content = item.content;
        let metadata = item.metadata;

        // Parse content if it's a string
        if (typeof content === 'string') {
          try {
            const parsedContent = JSON.parse(content);
            content = parsedContent;
            metadata = parsedContent.metadata || metadata;
          } catch (e) {
            // If parsing fails, use the string content
            content = { text: content };
          }
        }

        // Extract information from content
        const text = content.text || '';
        
        // Extract data using regex patterns
        const extractInfo = (text, pattern) => {
          const match = text.match(new RegExp(pattern, 'i'));
          return match ? match[1].trim() : null;
        };

        const extractedData = {
          name: item.title || 'Unknown',
          sector: 'Unknown',
          country: scraper.country || 'Unknown', // Use the country from scraper config
          website: extractInfo(text, /Site web\s*:\s*([^\n]+)/i),
          email: extractInfo(text, /E-mail\s*:\s*([^\n]+)/i),
          phone: extractInfo(text, /Tel\s*:\s*([^\n]+)/i),
          address: extractInfo(text, /Address\s*:\s*([^\n]+)/i),
          source: scraper.source, // Use the source URL instead of scraper name
          last_updated: new Date().toISOString()
        };

        // Clean up the data
        if (extractedData.website && !extractedData.website.startsWith('http')) {
          extractedData.website = `http://${extractedData.website}`;
        }

        // Remove any HTML tags from the extracted data
        Object.keys(extractedData).forEach(key => {
          if (typeof extractedData[key] === 'string') {
            extractedData[key] = extractedData[key].replace(/<[^>]*>/g, '');
          }
        });

        await supabase.from('companies').upsert(extractedData, { 
          onConflict: ['name', 'country', 'source'],
          ignoreDuplicates: false
        });
      }

      const { data: currentData, error: countError } = await supabase
        .from('scraped_data')
        .select('id')
        .eq('scraper_id', scraper.id);

      if (countError) {
        logger.error(`Error getting data count: ${countError.message}`);
      }

      const dataCount = currentData?.length || 0;

      await withRetry(async () => {
        await supabase
          .from('scrapers')
          .update({ 
            status: 'completed',
            last_run: new Date().toISOString(),
            data_count: dataCount
          })
          .eq('id', scraper.id);
      });

      logger.info(`Stored ${dataToInsert.length} items for scraper ${scraper.id}. Total items: ${dataCount}`);
    } else {
      logger.warn(`No data scraped for ${scraper.id}`);
      
      await withRetry(async () => {
        await supabase
          .from('scrapers')
          .update({ 
            status: 'completed',
            last_run: new Date().toISOString()
          })
          .eq('id', scraper.id);
      });
    }

    return scrapedData;
    
  } catch (error) {
    logger.error(`Error executing scraper ${scraper.id}: ${error.message}`);
    
    await withRetry(async () => {
      await supabase
        .from('scrapers')
        .update({ 
          status: 'error', 
          last_run: new Date().toISOString() 
        })
        .eq('id', scraper.id);
    });
    
    throw error;
  } finally {
    if (browser) {
      try {
        activeRequests.delete(browser);
        await browser.close();
      } catch (error) {
        logger.error(`Error closing browser: ${error.message}`);
      }
    }
  }
}

/**
 * Populate the companies table with data extracted from the scraped_data table.
 */
async function populateCompanies() {
  const { data: scrapedData, error } = await supabase.from('scraped_data').select('*');
  if (error) return logger.error('Error fetching scraped_data:', error);
  for (const record of scrapedData) {
    const meta = record.content || record.metadata || {};
    const company = {
      name: meta.name || record.title || 'Unknown',
      sector: meta.sector || 'Unknown',
      country: meta.country || 'Unknown',
      website: meta.website || null,
      linkedin: meta.linkedin || null,
      email: meta.email || null,
      source: record.scraper_id,
      last_updated: record.scraped_at,
    };
    const { data: exists } = await supabase.from('companies').select('id').eq('name', company.name).single();
    if (!exists) {
      await supabase.from('companies').insert(company);
    }
  }
  logger.info('Companies enrichment done.');
}

// Call after scraping
async function runScraperAndEnrich(scraper) {
  await executeScraper(scraper);
  await populateCompanies();
}

// Helper function to extract city from address
function extractCityFromAddress(address) {
  if (!address) return null;
  const cityMatch = address.match(/\s*-\s*([^-]+)$/);
  return cityMatch ? cityMatch[1].trim() : null;
}

module.exports = {
  executeScraper,
  populateCompanies,
  runScraperAndEnrich
};