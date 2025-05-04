const { logger } = require('../utils/logger');

async function randomDelay(min = 1000, max = 3000) {
  const delay = Math.floor(Math.random() * (max - min) + min);
  await new Promise(resolve => setTimeout(resolve, delay));
}

function getRandomHeaders(url = '') {
  const languages = [
    'en-US,en;q=0.9',
    'en-GB,en;q=0.9',
    'en-US,en;q=0.8,fr;q=0.5'
  ];

  const browsers = [
    {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      secChUa: '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
      platform: 'Windows'
    },
    {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      secChUa: '?0',
      platform: 'Windows'
    }
  ];

  const selectedBrowser = browsers[Math.floor(Math.random() * browsers.length)];
  const selectedLanguage = languages[Math.floor(Math.random() * languages.length)];

  // Base headers that work well for most sites
  const headers = {
    'User-Agent': selectedBrowser.userAgent,
    'Accept': selectedBrowser.accept,
    'Accept-Language': selectedLanguage,
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'DNT': '1'
  };

  // Special handling for theknot.com
  if (url.includes('theknot.com')) {
    headers['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';
    headers['Accept-Language'] = 'en-US,en;q=0.5';
    headers['Connection'] = 'close'; // Force HTTP/1.1
    headers['Host'] = 'www.theknot.com';
    headers['Referer'] = 'https://www.theknot.com/';
    // Remove HTTP/2 specific headers
    delete headers['Sec-Fetch-Dest'];
    delete headers['Sec-Fetch-Mode'];
    delete headers['Sec-Fetch-Site'];
    delete headers['Sec-Fetch-User'];
  }

  return headers;
}

async function setupPage(page, url) {
  // Get appropriate headers for the URL
  const headers = getRandomHeaders(url);
  await page.setExtraHTTPHeaders(headers);
  
  // Set viewport with slight randomization
  const width = 1920 + Math.floor(Math.random() * 100);
  const height = 1080 + Math.floor(Math.random() * 100);
  await page.setViewport({ 
    width,
    height,
    deviceScaleFactor: 1,
    hasTouch: false,
    isLandscape: true,
    isMobile: false
  });

  // Setup request interception
  await page.setRequestInterception(true);
  
  page.on('request', request => {
    const resourceType = request.resourceType();
    const url = request.url().toLowerCase();
    
    // Add headers to each request
    const requestHeaders = {
      ...request.headers(),
      ...getRandomHeaders(url)
    };

    // Handle resource types
    if ((url.includes('theknot.com') && resourceType === 'document') ||
        (!url.includes('theknot.com') && !['image', 'stylesheet', 'font', 'media'].includes(resourceType))) {
      request.continue({ headers: requestHeaders });
    } else {
      request.abort();
    }
  });

  // Override browser fingerprinting
  await page.evaluateOnNewDocument(() => {
    // Override navigator properties
    Object.defineProperty(Navigator.prototype, 'webdriver', {
      get: () => undefined
    });

    // Add plugins
    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        { name: 'Chrome PDF Plugin' },
        { name: 'Chrome PDF Viewer' },
        { name: 'Native Client' }
      ]
    });

    // Add language preferences
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en']
    });

    // Mock chrome runtime
    window.chrome = {
      runtime: {},
      loadTimes: () => {},
      csi: () => {},
      app: {}
    };

    // Override permissions API
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );
  });
}

async function genericScraper(browser, scraperConfig) {
  const url = scraperConfig.source || scraperConfig.url;
  const selector = scraperConfig.selectors?.main;
  
  if (!url) {
    throw new Error('URL is required for scraping');
  }
  
  logger.info(`Generic scraper running for URL: ${url} with selector: ${selector || 'none'}`);
  
  const page = await browser.newPage();
  
  try {
    // Setup page with appropriate configuration
    await setupPage(page, url);

    // Enhanced navigation options
    const navigationOptions = {
      waitUntil: url.includes('theknot.com') ? 'domcontentloaded' : ['domcontentloaded', 'networkidle2'],
      timeout: 30000
    };

    // Navigate with retry
    try {
      await page.goto(url, navigationOptions);
    } catch (error) {
      logger.warn(`Initial navigation failed: ${error.message}, retrying with modified settings...`);
      
      if (url.includes('theknot.com')) {
        // For theknot.com, try with different settings
        await page.setRequestInterception(false);
        await page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 60000
        });
      } else {
        throw error;
      }
    }

    // Wait and simulate human behavior
    await randomDelay(2000, 4000);
    
    // Scroll behavior
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          
          if (totalHeight >= Math.min(document.body.scrollHeight, 3000)) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });

    // Wait for content
    if (selector) {
      try {
        await page.waitForSelector(selector, { 
          timeout: 10000,
          visible: true 
        });
      } catch (error) {
        logger.warn(`Selector ${selector} not found initially, retrying...`);
        await randomDelay(2000, 3000);
        await page.reload({ waitUntil: 'networkidle2' });
        await page.waitForSelector(selector, { timeout: 10000 });
      }
    }

    // Extract data
    const data = await page.evaluate((selector) => {
      function getVisibleText(element) {
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') {
          return '';
        }

        return Array.from(element.childNodes)
          .map(node => {
            if (node.nodeType === 3) return node.textContent;
            if (node.nodeType === 1) return getVisibleText(node);
            return '';
          })
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
      }

      const results = [];
      
      if (selector) {
        document.querySelectorAll(selector).forEach(el => {
          results.push({
            text: getVisibleText(el),
            html: el.innerHTML,
            links: Array.from(el.querySelectorAll('a')).map(a => ({
              text: a.textContent.trim(),
              href: a.href,
              title: a.title || ''
            }))
          });
        });
      }

      // Fallback content detection if no results
      if (results.length === 0) {
        const mainContent = document.querySelector('main') || 
                          document.querySelector('article') || 
                          document.querySelector('.content');
        
        if (mainContent) {
          results.push({
            text: getVisibleText(mainContent),
            html: mainContent.innerHTML,
            links: Array.from(mainContent.querySelectorAll('a')).map(a => ({
              text: a.textContent.trim(),
              href: a.href,
              title: a.title || ''
            }))
          });
        }
      }

      return {
        title: document.title,
        url: window.location.href,
        results,
        metadata: {
          description: document.querySelector('meta[name="description"]')?.content,
          keywords: document.querySelector('meta[name="keywords"]')?.content,
          language: document.documentElement.lang
        }
      };
    }, selector);

    return data.results.map(item => ({
      title: data.title,
      content: item.text,
      url: data.url,
      metadata: {
        ...data.metadata,
        links: item.links
      }
    }));

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