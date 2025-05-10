const { logger } = require('../utils/logger');

/**
 * Specialized scraper for news portals that extracts articles
 * @param {Object} browser - Puppeteer browser instance
 * @param {Object} scraperConfig - Configuration for the scraper
 * @returns {Array} Array of scraped article objects
 */
async function newsPortalScraper(browser, scraperConfig) {
  const url = scraperConfig.url;
  
  if (!url) {
    throw new Error('URL is required for scraping');
  }
  
  logger.info(`News portal scraper running for URL: ${url}`);
  
  const page = await browser.newPage();
  
  try {
    // Set viewport and user agent for better compatibility
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Navigate to the page
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Extract articles from the page
    const articleLinks = await page.evaluate(() => {
      // This selector pattern should be adjusted based on the specific news portal structure
      // Looking for common article link patterns
      const articleSelectors = [
        'a.article', 'a.news-item', '.article a', '.news-item a', 
        'article a', '.story a', '.post a', '.entry a'
      ];
      
      let links = [];
      
      // Try each selector
      for (const selector of articleSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          links = Array.from(elements).map(el => el.href);
          break;
        }
      }
      
      // If no articles found with predefined selectors, try a more generic approach
      if (links.length === 0) {
        links = Array.from(document.querySelectorAll('a'))
          .filter(a => {
            const href = a.href;
            // Look for URLs that contain common article indicators
            return href.includes('/article/') || 
                   href.includes('/news/') || 
                   href.includes('/story/') ||
                   href.match(/\d{4}\/\d{2}\/\d{2}/); // Date pattern in URL
          })
          .map(a => a.href);
      }
      
      return [...new Set(links)]; // Remove duplicates
    });
    
    logger.info(`Found ${articleLinks.length} article links to scrape`);
    
    // Limit the number of articles to process (to avoid overwhelming the system)
    const linksToProcess = articleLinks.slice(0, 10);
    
    // Process each article
    const articles = [];
    
    for (const articleUrl of linksToProcess) {
      try {
        logger.info(`Scraping article: ${articleUrl}`);
        
        // Navigate to the article
        await page.goto(articleUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Extract article data
        const articleData = await page.evaluate(() => {
          // Extract title (try common selectors)
          const titleSelectors = [
            'h1', 'h1.title', '.article-title', '.entry-title', 
            '.post-title', '.headline', 'article h1'
          ];
          
          let title = '';
          for (const selector of titleSelectors) {
            const el = document.querySelector(selector);
            if (el) {
              title = el.textContent.trim();
              break;
            }
          }
          
          // Extract date (try common selectors)
          const dateSelectors = [
            '.date', '.article-date', '.post-date', '.published', 
            'time', '[itemprop="datePublished"]', '.timestamp'
          ];
          
          let date = '';
          for (const selector of dateSelectors) {
            const el = document.querySelector(selector);
            if (el) {
              date = el.textContent.trim() || el.getAttribute('datetime');
              break;
            }
          }
          
          // Extract author (try common selectors)
          const authorSelectors = [
            '.author', '.article-author', '.byline', '[rel="author"]',
            '[itemprop="author"]', '.writer'
          ];
          
          let author = '';
          for (const selector of authorSelectors) {
            const el = document.querySelector(selector);
            if (el) {
              author = el.textContent.trim();
              break;
            }
          }
          
          // Extract content (try common selectors)
          const contentSelectors = [
            'article', '.article-content', '.entry-content', '.post-content',
            '.story-content', '[itemprop="articleBody"]', '.content'
          ];
          
          let content = '';
          for (const selector of contentSelectors) {
            const el = document.querySelector(selector);
            if (el) {
              // Remove any script or ad elements from the content
              Array.from(el.querySelectorAll('script, .ad, .advertisement')).forEach(node => node.remove());
              content = el.textContent.trim();
              break;
            }
          }
          
          return {
            title,
            content,
            metadata: {
              author,
              publishDate: date
            }
          };
        });
        
        articles.push({
          nom: articleData.title,
          contenu: articleData.content,
          lien: articleUrl,
          metadata: articleData.metadata
        });
        
        // Small delay to avoid overloading the server
        await page.waitForTimeout(1000);
        
      } catch (articleError) {
        logger.error(`Error scraping article ${articleUrl}: ${articleError.message}`);
        // Continue with next article
      }
    }
    
    return articles;
  } catch (error) {
    logger.error(`Error in news portal scraper: ${error.message}`);
    throw error;
  } finally {
    await page.close();
  }
}

module.exports = {
  newsPortalScraper
};