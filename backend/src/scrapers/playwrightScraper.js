const { chromium } = require('playwright');
const logger = require('../utils/logger');
const scraperStatusHandler = require('../websocket/scraperStatusHandler');

/**
 * Playwright scraper: supports clicking dropdowns and extracting any content via multiple selectors.
 * @param {string} url - The starting URL.
 * @param {Object} selectors - Object containing main, child, pagination, and dropdownClick selectors
 * @param {string} scraperId - The ID of the scraper for status updates
 * @returns {Promise<object[]>}
 */
async function playwrightScraper(url, selectors, scraperId) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  logger.info(`Launching browser in ${isProduction ? 'headless' : 'visible'} mode`);
  logger.info(`Using chromium at ${process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || 'default location'}`);
  
  const browser = await chromium.launch({ 
    headless: isProduction ? true : false,  // Always use headless in production
    args: [
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-extensions'
    ],
    chromiumSandbox: false,
    timeout: 60000,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined
  });

  // Send initial status
  scraperStatusHandler.updateStatus(scraperId, {
    status: 'running',
    currentPage: 0,
    totalItems: 0,
    type: 'info',
    message: 'Starting browser...'
  });

  const page = await browser.newPage();
  
  // Set a longer navigation timeout for slower connections
  page.setDefaultNavigationTimeout(60000);
  
  let results = [];
  let currentUrl = url;
  let pageNum = 1;

  try {
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

      await page.goto(currentUrl, { timeout: 60000, waitUntil: 'domcontentloaded' });

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
      } else {
        try {
          await Promise.all([
            page.waitForNavigation({ timeout: 60000 }),
            nextLink.click()
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
    throw error;
  } finally {
    await browser.close();
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