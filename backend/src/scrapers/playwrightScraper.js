const { chromium } = require('playwright');
const logger = require('../utils/logger');

/**
 * Playwright scraper: supports clicking dropdowns and extracting any content via multiple selectors.
 * @param {string} url - The starting URL.
 * @param {Object} selectors - Object containing main, child, pagination, and dropdownClick selectors
 * @returns {Promise<object[]>}
 */
async function playwrightScraper(url, selectors) {
  const isProduction = process.env.NODE_ENV === 'production';
  const browser = await chromium.launch({ 
    headless: isProduction,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });
  const page = await browser.newPage();
  let results = [];
  let currentUrl = url;
  let pageNum = 1;

  try {
    logger.info(`Starting scraping for URL: ${url}`);
    while (true) {
      logger.info(`Processing page ${pageNum}: ${currentUrl}`);
      await page.goto(currentUrl, { timeout: 60000 });

      // Click all dropdowns/arrows if a selector is provided
      if (selectors.dropdownClick) {
        const dropdowns = await page.$$(selectors.dropdownClick);
        logger.info(`Found ${dropdowns.length} dropdown elements to click`);
        for (const dropdown of dropdowns) {
          try {
            await dropdown.click();
            await page.waitForTimeout(200);
          } catch (e) {
            logger.warn(`Failed to click dropdown: ${e.message}`);
          }
        }
      }

      // Wait for the main container to appear
      try {
        await page.waitForSelector(selectors.main, { timeout: 3000 });
      } catch (e) {
        logger.error(`Main container not found: ${e.message}`);
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
                // Handle different types of elements and attributes
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

      // Handle pagination if selector is provided
      if (!selectors.pagination) break;
      const nextLink = await page.$(selectors.pagination);
      if (!nextLink) {
        logger.info('No more pages to process');
        break;
      }

      const href = await nextLink.getAttribute('href');
      if (href) {
        const newUrl = href.startsWith('http') ? href : new URL(href, currentUrl).toString();
        if (newUrl === currentUrl) {
          logger.info('Reached last page (same URL)');
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
          break;
        }
      }

      pageNum++;
      if (pageNum > 50) {
        logger.info('Reached maximum page limit (50)');
        break;
      }
    }
  } catch (error) {
    logger.error(`Scraping error: ${error.message}`);
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