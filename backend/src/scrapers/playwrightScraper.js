const { chromium } = require('playwright');

/**
 * Playwright scraper: supports clicking dropdowns and extracting any content via multiple selectors.
 * @param {string} url - The starting URL.
 * @param {string} selector - Comma-separated CSS selectors for the content to extract.
 * @param {string} [paginationSelector] - The CSS selector for the next page link/button (optional).
 * @param {string} [dropdownClickSelector] - The CSS selector for dropdowns/arrows to click (optional).
 * @returns {Promise<object[]>}
 */
async function playwrightScraper(url, selector, paginationSelector, dropdownClickSelector) {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  let results = [];
  let currentUrl = url;
  let pageNum = 1;

  // Split the selector string by comma and trim whitespace
  const selectors = selector.split(',').map(s => s.trim());

  try {
    while (true) {
      await page.goto(currentUrl, { timeout: 60000 });

  
// Click all dropdown arrows to expand contact info
// Click all dropdowns/arrows if a selector is provided
if (dropdownClickSelector && dropdownClickSelector.trim().length > 0) {
    const dropdowns = await page.$$(dropdownClickSelector);
    for (const dropdown of dropdowns) {
      try {
        await dropdown.click();
        await page.waitForTimeout(200);
      } catch (e) {}
    }
  }
      // Wait for at least one of the selectors to appear (ignore missing ones)
      for (const sel of selectors) {
        try {
          await page.waitForSelector(sel, { timeout: 3000 });
        } catch (e) {}
      }

      // Extract all elements matching any of the selectors, with their selector and text/html/attributes
      const pageResults = await page.evaluate((selectors) => {
        const allResults = [];
        selectors.forEach(sel => {
          document.querySelectorAll(sel).forEach(el => {
            // For mailto links, prefer the 'href' attribute value (email address)
            let value = null;
            if (sel.includes('mailto')) {
              value = el.getAttribute('href')?.replace('mailto:', '') || el.innerText;
            } else if (el.getAttribute('href')) {
              value = el.getAttribute('href');
            } else if (el.value) {
              value = el.value;
            } else {
              value = el.innerText;
            }
            allResults.push({
              selector: sel,
              text: el.innerText,
              html: el.outerHTML,
              href: el.getAttribute('href') || null,
              value
            });
          });
        });
        return allResults;
      }, selectors);
      results = results.concat(pageResults);

      if (!paginationSelector) break;
      const nextLink = await page.$(paginationSelector);
      if (!nextLink) break;
      const href = await nextLink.getAttribute('href');
      if (href) {
        const newUrl = href.startsWith('http') ? href : new URL(href, currentUrl).toString();
        if (newUrl === currentUrl) break;
        currentUrl = newUrl;
      } else {
        await Promise.all([
          page.waitForNavigation({ timeout: 60000 }),
          nextLink.click()
        ]);
        currentUrl = page.url();
      }
      pageNum++;
      if (pageNum > 50) break;
    }
  } finally {
    await browser.close();
  }
  return results;
}

module.exports = { playwrightScraper };