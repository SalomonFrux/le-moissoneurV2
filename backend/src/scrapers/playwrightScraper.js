const { chromium } = require('playwright');
const logger = require('../utils/logger');
const scraperStatusHandler = require('../websocket/scraperStatusHandler');
const fs = require('fs');
const { puppeteerScraper } = require('./puppeteerScraper');

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
  
  const launchOptions = {
    headless: isProduction ? true : false, // Keep headless true for prod, false for dev
    args: [
      '--disable-dev-shm-usage', '--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu',
      '--disable-software-rasterizer', '--disable-extensions', '--disable-features=site-per-process',
      '--disable-background-networking', '--disable-default-apps', '--disable-sync', '--mute-audio',
      '--no-first-run', '--no-zygote', /*'--single-process',*/ '--no-startup-window', // single-process can cause issues
      `--window-size=${process.env.SCREEN_WIDTH || 1920},${process.env.SCREEN_HEIGHT || 1080}`,
      '--ignore-certificate-errors', '--ignore-certificate-errors-spki-list',
      '--disable-infobars', '--disable-notifications', '--disable-dev-tools'
    ],
    chromiumSandbox: !isProduction, // false for local dev (Windows), true for production (Linux)
    timeout: parseInt(process.env.BROWSER_LAUNCH_TIMEOUT, 10) || 180000,
    ignoreDefaultArgs: ['--enable-automation'],
    ignoreHTTPSErrors: true,
    handleSIGINT: true,
    handleSIGTERM: true,
    handleSIGHUP: true
  };

  if (isProduction && process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  } else if (!isProduction) {
    // For local dev, don't set executablePath to let Playwright use its installed browser
    // unless explicitly overridden by a .env var for local dev.
    if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH_DEV) {
        launchOptions.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH_DEV;
    }
  }
  
  logger.info('Launching browser with Playwright options:', launchOptions);

  let browser = null;
  let context = null;
  let page = null;
  let results = [];
  let pageNum = 1;
  let hasNextPage = true;

  try {
    const browserType = chromium; // Or specify based on config if needed
    browser = await browserType.launch(launchOptions);
    logger.info('Playwright browser launched successfully.');
    scraperStatusHandler.updateStatus(scraperId, {
      status: 'running', currentPage: 0, totalItems: 0, type: 'info', message: 'Browser launched successfully'
    });

    logger.info('Creating new browser context...');
    context = await browser.newContext({
        ignoreHTTPSErrors: true, // Already in launchOptions but good for context too
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' // Optional: set a common user agent
    });
    logger.info('Browser context created.');

    logger.info('Creating new page...');
    page = await context.newPage();
    logger.info('New page created.');
    
    const navigationTimeout = parseInt(process.env.NAVIGATION_TIMEOUT, 10) || 60000;
    logger.info(`Setting default navigation timeout to ${navigationTimeout}ms`);
    page.setDefaultNavigationTimeout(navigationTimeout);
    page.setDefaultTimeout(navigationTimeout); // For other actions like clicks, waitForSelector

    let currentUrl = url;

    while (hasNextPage && (pageNum <= (parseInt(process.env.MAX_PAGES_PER_SCRAPE, 10) || 50))) {
      logger.info(`Scraping page ${pageNum}: ${currentUrl}`);
      scraperStatusHandler.updateStatus(scraperId, {
        status: 'running', currentPage: pageNum, totalItems: results.length, type: 'info', message: `Navigating to page ${pageNum}: ${currentUrl.substring(0, 100)}...`
      });

      try {
        logger.info(`Attempting page.goto(\'${currentUrl}\')`);
        const response = await page.goto(currentUrl, { waitUntil: 'domcontentloaded' });
        if (response) {
            logger.info(`Navigation to ${currentUrl} successful. Status: ${response.status()}`);
        } else {
            logger.warn(`Navigation to ${currentUrl} returned null/undefined response object.`);
        }
        scraperStatusHandler.updateStatus(scraperId, {
            status: 'running', currentPage: pageNum, totalItems: results.length, type: 'info', message: `Page ${pageNum} loaded. Searching for content...`
        });
      } catch (navError) {
        logger.error(`Playwright page.goto(\'${currentUrl}\') failed:`, navError);
        scraperStatusHandler.updateStatus(scraperId, {
          status: 'error', currentPage: pageNum, totalItems: results.length, type: 'error', message: `Failed to navigate to ${currentUrl.substring(0,100)}: ${navError.message}`
        });
        throw navError; // Propagate error to main catch
      }

      // Click all dropdowns/arrows if a selector is provided
      if (selectors.dropdownClick) {
        const dropdowns = await page.$$(selectors.dropdownClick);
        logger.info(`Found ${dropdowns.length} dropdown elements to click`);
        scraperStatusHandler.updateStatus(scraperId, {
          status: 'running', currentPage: pageNum, totalItems: results.length, type: 'info', message: `Found ${dropdowns.length} dropdown elements to expand`
        });

        for (const dropdown of dropdowns) {
          try {
            await dropdown.click();
            await page.waitForTimeout(200);
          } catch (e) {
            logger.warn(`Failed to click dropdown: ${e.message}`);
            scraperStatusHandler.updateStatus(scraperId, {
              status: 'running', currentPage: pageNum, totalItems: results.length, type: 'warning', message: `Failed to click a dropdown element: ${e.message}`
            });
          }
        }
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
          status: 'running', currentPage: pageNum, totalItems: results.length, type: 'success', message: `Found ${pageResults.length} items on page ${pageNum}. Total: ${results.length}`
        });
      } catch (error) {
        logger.error(`Error extracting data from page ${pageNum}:`, error);
        scraperStatusHandler.updateStatus(scraperId, {
          status: 'error', currentPage: pageNum, totalItems: results.length, type: 'error', message: `Error extracting data: ${error.message}`
        });
        throw error; // Propagate error to main catch
      }

      // Handle pagination if selector is provided
      if (!selectors.pagination) {
        logger.info('No pagination selector provided, finishing scrape');
        hasNextPage = false;
        break;
      }

      try {
        const nextPageLink = await page.$(selectors.pagination);
        if (nextPageLink) {
          currentUrl = await page.evaluate(el => el.href, nextPageLink);
          logger.info(`Found next page link: ${currentUrl}`);
          pageNum++;
        } else {
          logger.info('No next page link found.');
          hasNextPage = false;
        }
      } catch (paginationError) {
        logger.error('Error finding or evaluating pagination selector:', paginationError);
        hasNextPage = false;
      }
    }

    logger.info('Scraping loop completed.');
    scraperStatusHandler.updateStatus(scraperId, {
      status: 'completed', currentPage: pageNum -1, totalItems: results.length, type: 'success', message: 'Scraping process finished by Playwright.'
    });
    return results;

  } catch (error) {
    logger.error(`Playwright scraper failed: ${error.message}. Stack: ${error.stack}`);
    // Try to close browser before falling back
    if (browser) {
        try {
            logger.info('Closing Playwright browser due to error before fallback...');
            await browser.close();
            logger.info('Playwright browser closed.');
        } catch (closeError) {
            logger.error('Error closing Playwright browser during fallback prep:', closeError);
        }
    }
    scraperStatusHandler.updateStatus(scraperId, {
      status: 'running', // Still 'running' because we're trying a fallback
      currentPage: pageNum, 
      totalItems: results.length, 
      type: 'warning',
      message: `Playwright failed: ${error.message.substring(0,100)}. Switching to Puppeteer fallback.`
    });
    return puppeteerScraper(url, selectors, scraperId); // Fallback
  } finally {
    if (browser && browser.isConnected()) {
      logger.info('Finalizing Playwright: closing browser...');
      try {
        await browser.close();
        logger.info('Playwright browser closed successfully in finally block.');
      } catch (e) {
        logger.error('Error closing Playwright browser in finally block:', e);
      }
    } else if (browser && !browser.isConnected()) {
        logger.info('Playwright browser already disconnected in finally.')
    }
  }
}

module.exports = {
  playwrightScraper
};
