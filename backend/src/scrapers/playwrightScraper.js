const { chromium } = require('playwright');

/**
 * Playwright scraper: supports clicking dropdowns and extracting any content via multiple selectors.
 * @param {string} url - The starting URL.
 * @param {Object} selectors - Object containing main, child, pagination, and dropdownClick selectors
 * @returns {Promise<object[]>}
 */
async function playwrightScraper(url, selectors) {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  let results = [];
  let currentUrl = url;
  let pageNum = 1;

  try {
    while (true) {
      await page.goto(currentUrl, { timeout: 60000 });

      // Click all dropdowns/arrows if a selector is provided
      if (selectors.dropdownClick) {
        const dropdowns = await page.$$(selectors.dropdownClick);
        for (const dropdown of dropdowns) {
          try {
            await dropdown.click();
            await page.waitForTimeout(200);
          } catch (e) {}
        }
      }

      // Wait for the main container to appear
      try {
        await page.waitForSelector(selectors.main, { timeout: 3000 });
      } catch (e) {
        console.error('Main container not found:', e);
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

      results = results.concat(pageResults);

      // Handle pagination if selector is provided
      if (!selectors.pagination) break;
      const nextLink = await page.$(selectors.pagination);
      if (!nextLink) break;

      const href = await nextLink.getAttribute('href');
      if (href) {
        const newUrl = href.startsWith('http') ? href : new URL(href, currentUrl).toString();
        if (newUrl === currentUrl) break;
        currentUrl = newUrl;
      } else {
        try {
          await Promise.all([
            page.waitForNavigation({ timeout: 60000 }),
            nextLink.click()
          ]);
          currentUrl = page.url();
        } catch (e) {
          console.error('Navigation failed:', e);
          break;
        }
      }

      pageNum++;
      if (pageNum > 50) break; // Limit to 50 pages
    }
  } finally {
    await browser.close();
  }

  return results;
}

module.exports = {
  playwrightScraper
};