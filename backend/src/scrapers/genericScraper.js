const { logger } = require('../utils/logger');

/**
 * Generic scraper implementation that extracts basic information from a webpage
 * @param {Object} browser - Puppeteer browser instance
 * @param {Object} scraperConfig - Configuration for the scraper
 * @returns {Array} Array of scraped data objects
 */
async function genericScraper(browser, scraperConfig) {
  const url = scraperConfig.url;
  
  if (!url) {
    throw new Error('URL is required for scraping');
  }
  
  logger.info(`Generic scraper running for URL: ${url}`);
  
  const page = await browser.newPage();
  
  try {
    // Set viewport and user agent for better compatibility
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Navigate to the page
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Extract data from the page
    const data = await page.evaluate(() => {
      // Extract title
      const title = document.title;
      
      // Extract meta description
      const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
      
      // Extract main content (adjust selectors based on common patterns)
      const mainContent = document.querySelector('main') || 
                          document.querySelector('article') || 
                          document.querySelector('.content') ||
                          document.querySelector('#content');
      
      const content = mainContent ? mainContent.textContent.trim() : '';
      
      // Extract links
      const links = Array.from(document.querySelectorAll('a'))
        .map(a => ({ text: a.textContent.trim(), href: a.href }))
        .filter(link => link.text && link.href.startsWith('http'));
      
      // Extract images
      const images = Array.from(document.querySelectorAll('img'))
        .map(img => ({ 
          src: img.src, 
          alt: img.alt,
          width: img.width,
          height: img.height 
        }))
        .filter(img => img.src && img.src.startsWith('http'));
      
      return {
        title,
        content,
        metadata: {
          description: metaDescription,
          links,
          images
        }
      };
    });
    
    // Return the scraped data
    return [{
      title: data.title,
      content: data.content,
      url: url,
      metadata: data.metadata
    }];
  } catch (error) {
    logger.error(`Error in generic scraper: ${error.message}`);
    throw error;
  } finally {
    await page.close();
  }
}

module.exports = {
  genericScraper
};