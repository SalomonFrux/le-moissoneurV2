const puppeteer = require('puppeteer');
const logger = require('../utils/logger');
const scraperStatusHandler = require('../websocket/scraperStatusHandler');
const fs = require('fs');

/**
 * Puppeteer scraper: supports clicking dropdowns and extracting any content via multiple selectors.
 * This is optimized for VM environment.
 * @param {string} url - The starting URL.
 * @param {Object} selectors - Object containing main, child, pagination, and dropdownClick selectors
 * @param {string} scraperId - The ID of the scraper for status updates
 * @returns {Promise<object[]>}
 */
async function puppeteerScraper(url, selectors, scraperId) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  logger.info(`Launching browser in ${isProduction ? 'headless' : 'visible'} mode`);
  
  // Check if chromium exists at the configured path
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser';
  if (isProduction) {
    try {
      fs.accessSync(executablePath, fs.constants.X_OK);
      logger.info(`Chromium found at: ${executablePath}`);
    } catch (err) {
      logger.error(`Chromium not found at ${executablePath}: ${err.message}`);
      
      // Log alternative locations that might exist
      ['/usr/bin/chromium', '/snap/bin/chromium'].forEach(path => {
        try {
          fs.accessSync(path, fs.constants.X_OK);
          logger.info(`Alternative Chromium found at: ${path}`);
        } catch (e) {
          logger.info(`No Chromium at: ${path}`);
        }
      });
    }
  }
  
  let browser = null;
  let results = [];
  let pageNum = 1;
  
  try {
    // Set initial status before browser launch
    scraperStatusHandler.updateStatus(scraperId, {
      status: 'running',
      currentPage: 0,
      totalItems: 0,
      type: 'info',
      message: 'Starting browser...'
    });
    
    // Launch browser with optimized settings for VM environment
    browser = await puppeteer.launch({
      headless: isProduction ? 'new' : false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--single-process',
        '--no-zygote',
        '--disable-extensions',
        '--disable-features=site-per-process',
        '--disable-component-extensions-with-background-pages',
        '--disable-default-apps',
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-spki-list',
        '--disable-infobars',
        '--disable-notifications',
        '--disable-dev-tools'
      ],
      executablePath,
      timeout: 180000, // 3 minutes
      protocolTimeout: 180000,
      ignoreHTTPSErrors: true,
      handleSIGINT: true,
      handleSIGTERM: true,
      handleSIGHUP: true
    });
    
    if (!browser) {
      throw new Error('Failed to launch browser');
    }

    // Send initial status
    scraperStatusHandler.updateStatus(scraperId, {
      status: 'running',
      currentPage: 0,
      totalItems: 0,
      type: 'info',
      message: 'Browser started, navigating to website...'
    });

    const page = await browser.newPage();
    
    // Set a longer navigation timeout for slower connections
    page.setDefaultTimeout(60000);
    
    let currentUrl = url;

    logger.info(`Starting scraping for URL: ${url}`);
    scraperStatusHandler.updateStatus(scraperId, {
      status: 'running',
      currentPage: pageNum,
      totalItems: results.length,
      type: 'info',
      message: `Starting scraping from ${url}`
    });

    while (true) {
      logger.info(`Processing page ${pageNum}: ${currentUrl}`);
      scraperStatusHandler.updateStatus(scraperId, {
        status: 'running',
        currentPage: pageNum,
        totalItems: results.length,
        type: 'info',
        message: `Navigating to page ${pageNum}`
      });

      await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

      // Click all dropdowns/arrows if a selector is provided
      if (selectors.dropdownClick) {
        const dropdowns = await page.$$(selectors.dropdownClick);
        logger.info(`Found ${dropdowns.length} dropdown elements to click`);
        scraperStatusHandler.updateStatus(scraperId, {
          status: 'running',
          currentPage: pageNum,
          totalItems: results.length,
          type: 'info',
          message: `Found ${dropdowns.length} dropdown elements to expand`
        });

        for (const dropdown of dropdowns) {
          try {
            await dropdown.click();
            await page.waitForTimeout(200);
          } catch (e) {
            logger.warn(`Failed to click dropdown: ${e.message}`);
            scraperStatusHandler.updateStatus(scraperId, {
              status: 'running',
              currentPage: pageNum,
              totalItems: results.length,
              type: 'warning',
              message: `Failed to click a dropdown element: ${e.message}`
            });
          }
        }
      }

      // Wait for the main container to appear
      try {
        await page.waitForSelector(selectors.main, { timeout: 5000 });
      } catch (e) {
        logger.error(`Main container not found: ${e.message}`);
        scraperStatusHandler.updateStatus(scraperId, {
          status: 'error',
          currentPage: pageNum,
          totalItems: results.length,
          type: 'error',
          message: `Main container not found on page ${pageNum}: ${e.message}`
        });
        break;
      }

      // Extract data from all matching main containers
      const pageResults = await page.evaluate((config) => {
        const mainContainers = document.querySelectorAll(config.main);
        const results = [];

        mainContainers.forEach(container => {
          const data = {
            text: container.innerText,
            metadata: {}
          };

          // Extract data using child selectors
          if (config.child) {
            Object.entries(config.child).forEach(([key, selector]) => {
              const element = container.querySelector(selector);
              if (element) {
                if (key === 'email' && element.href?.startsWith('mailto:')) {
                  data.metadata[key] = element.href.replace('mailto:', '');
                } else if (key === 'website' && element.href) {
                  data.metadata[key] = element.href;
                } else if (key === 'phone' && element.href?.startsWith('tel:')) {
                  data.metadata[key] = element.href.replace('tel:', '');
                } else {
                  data.metadata[key] = element.innerText.trim();
                }
              }
            });
          }

          results.push(data);
        });

        return results;
      }, selectors);

      logger.info(`Found ${pageResults.length} results on page ${pageNum}`);
      results = results.concat(pageResults);

      scraperStatusHandler.updateStatus(scraperId, {
        status: 'running',
        currentPage: pageNum,
        totalItems: results.length,
        type: 'success',
        message: `Found ${pageResults.length} items on page ${pageNum}. Total: ${results.length}`
      });

      // Handle pagination if selector is provided
      if (!selectors.pagination) break;
      
      // Check if pagination selector exists
      const nextLinkExists = await page.$(selectors.pagination);
      if (!nextLinkExists) {
        logger.info('No more pages to process');
        scraperStatusHandler.updateStatus(scraperId, {
          status: 'completed',
          currentPage: pageNum,
          totalItems: results.length,
          type: 'success',
          message: 'Reached the last page'
        });
        break;
      }

      // Try to get the href attribute
      const href = await page.evaluate((selector) => {
        const element = document.querySelector(selector);
        return element ? element.getAttribute('href') : null;
      }, selectors.pagination);

      if (href) {
        const newUrl = href.startsWith('http') ? href : new URL(href, currentUrl).toString();
        if (newUrl === currentUrl) {
          logger.info('Reached last page (same URL)');
          scraperStatusHandler.updateStatus(scraperId, {
            status: 'completed',
            currentPage: pageNum,
            totalItems: results.length,
            type: 'success',
            message: 'Completed scraping all pages'
          });
          break;
        }
        currentUrl = newUrl;
      } else {
        try {
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }),
            page.click(selectors.pagination)
          ]);
          currentUrl = page.url();
        } catch (e) {
          logger.error(`Navigation failed: ${e.message}`);
          scraperStatusHandler.updateStatus(scraperId, {
            status: 'error',
            currentPage: pageNum,
            totalItems: results.length,
            type: 'error',
            message: `Failed to navigate to next page: ${e.message}`
          });
          break;
        }
      }

      pageNum++;
      if (pageNum > 50) {
        logger.info('Reached maximum page limit (50)');
        scraperStatusHandler.updateStatus(scraperId, {
          status: 'completed',
          currentPage: pageNum - 1,
          totalItems: results.length,
          type: 'warning',
          message: 'Reached maximum page limit (50)'
        });
        break;
      }
    }
  } catch (error) {
    logger.error(`Scraping error: ${error.message}`);
    scraperStatusHandler.updateStatus(scraperId, {
      status: 'error',
      currentPage: pageNum,
      totalItems: results.length,
      type: 'error',
      message: `Scraping error: ${error.message}`,
      error: error.message
    });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (err) {
        logger.error(`Error closing browser: ${err.message}`);
      }
    }
    logger.info(`Scraping completed. Total results: ${results.length}`);
  }

  // Transform the results to match the expected format
  return results.map(result => ({
    name: result.metadata.name || '',
    phone: result.metadata.phone || '',
    email: result.metadata.email || '',
    website: result.metadata.website || '',
    address: result.metadata.address || '',
    category: result.metadata.category || '',
    text: result.text,
    metadata: result.metadata
  }));
}

module.exports = {
  puppeteerScraper
}; 