const { chromium } = require('playwright');
const logger = require('../utils/logger');
const scraperStatusHandler = require('../websocket/scraperStatusHandler');
const fs = require('fs');

/**
 * Playwright scraper: supports clicking dropdowns and extracting any content via multiple selectors.
 * @param {string} url - The starting URL.
 * @param {Object} selectors - Object containing main, child, pagination, and dropdownClick selectors
 * @param {string} scraperId - The ID of the scraper for status updates
 * @returns {Promise<object[]>}
 */
async function playwrightScraper(url, selectors, scraperId) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  logger.info(`Starting playwrightScraper for URL: ${url}`);
  logger.info(`Selectors:`, JSON.stringify(selectors, null, 2));
  
  // Check if chromium exists at the configured path
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium-browser';
  if (executablePath) {
    try {
      fs.accessSync(executablePath, fs.constants.X_OK);
      logger.info(`Chromium found at: ${executablePath}`);
    } catch (err) {
      logger.error(`Chromium not found at ${executablePath}: ${err.message}`);
      throw new Error(`Chromium not found at ${executablePath}: ${err.message}`);
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
    
    const launchTimeout = 180000; // 3 minutes
    
    logger.info('Launching browser with options:', {
      headless: isProduction,
      executablePath,
      timeout: launchTimeout
    });

    // Launch browser with timeout handling
    let launchPromise = chromium.launch({ 
      headless: isProduction ? true : false,
      args: [
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions',
        '--disable-features=site-per-process',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-sync',
        '--mute-audio',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--no-startup-window',
        '--window-size=1920,1080',
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-spki-list',
        '--disable-infobars',
        '--disable-notifications',
        '--disable-dev-tools'
      ],
      chromiumSandbox: false,
      timeout: launchTimeout,
      executablePath,
      ignoreDefaultArgs: ['--enable-automation'],
      ignoreHTTPSErrors: true,
      handleSIGINT: true,
      handleSIGTERM: true,
      handleSIGHUP: true
    });
    
    // Add a timeout for browser launch
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Browser launch timed out after ${launchTimeout}ms`)), launchTimeout);
    });
    
    browser = await Promise.race([launchPromise, timeoutPromise]);
    
    if (!browser) {
      throw new Error('Failed to launch browser');
    }

    logger.info('Browser launched successfully');

    // Send initial status
    scraperStatusHandler.updateStatus(scraperId, {
      status: 'running',
      currentPage: 0,
      totalItems: 0,
      type: 'info',
      message: 'Browser launched successfully'
    });

    const page = await browser.newPage();
    logger.info('New page created');
    
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

      try {
        await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        logger.info(`Successfully navigated to page ${pageNum}`);
      } catch (error) {
        logger.error(`Navigation error on page ${pageNum}:`, error);
        scraperStatusHandler.updateStatus(scraperId, {
          status: 'error',
          currentPage: pageNum,
          totalItems: results.length,
          type: 'error',
          message: `Failed to navigate to page ${pageNum}: ${error.message}`
        });
        break;
      }

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
        logger.info(`Waiting for main selector: ${selectors.main}`);
        await page.waitForSelector(selectors.main, { timeout: 5000 });
        logger.info('Main selector found');
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
      try {
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
      } catch (error) {
        logger.error(`Error extracting data from page ${pageNum}:`, error);
        scraperStatusHandler.updateStatus(scraperId, {
          status: 'error',
          currentPage: pageNum,
          totalItems: results.length,
          type: 'error',
          message: `Error extracting data: ${error.message}`
        });
        break;
      }

      // Handle pagination if selector is provided
      if (!selectors.pagination) {
        logger.info('No pagination selector provided, finishing scrape');
        break;
      }

      try {
        const nextLink = await page.$(selectors.pagination);
        if (!nextLink) {
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

        const href = await nextLink.getAttribute('href');
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
          logger.info(`Next page URL: ${currentUrl}`);
        } else {
          try {
            logger.info('Clicking pagination element');
            await Promise.all([
              page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }),
              nextLink.click()
            ]);
            currentUrl = page.url();
            logger.info(`Navigated to: ${currentUrl}`);
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
      } catch (error) {
        logger.error(`Error handling pagination: ${error.message}`);
        scraperStatusHandler.updateStatus(scraperId, {
          status: 'error',
          currentPage: pageNum,
          totalItems: results.length,
          type: 'error',
          message: `Pagination error: ${error.message}`
        });
        break;
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
    throw error;
  } finally {
    if (browser) {
      try {
        await browser.close();
        logger.info('Browser closed successfully');
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
  playwrightScraper
};