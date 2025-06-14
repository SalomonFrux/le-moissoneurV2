const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;
const { supabase } = require('../db/supabase');

// Initialize stealth plugin
puppeteer.use(StealthPlugin());

// Load proxies from configuration
async function loadProxies() {
  try {
    const configPath = path.join(__dirname, '..', 'config', 'proxies.json');
    const proxiesData = await fs.readFile(configPath, 'utf8');
    return JSON.parse(proxiesData);
  } catch (error) {
    logger.warn('No proxies configuration found, continuing without proxies');
    return [];
  }
}

// Helper functions
async function randomDelay(min = 1000, max = 3000) {
  const delay = Math.floor(Math.random() * (max - min) + min);
  await new Promise(resolve => setTimeout(resolve, delay));
}

function getRandomHeaders() {
  const chromeVersions = [
    { version: '122', brand: '"Google Chrome";v="122"' },
    { version: '121', brand: '"Google Chrome";v="121"' },
    { version: '120', brand: '"Google Chrome";v="120"' }
  ];

  const languages = [
    'en-US,en;q=0.9',
    'en-GB,en;q=0.9',
    'en-CA,en;q=0.9',
    'en-AU,en;q=0.9'
  ];

  const platforms = ['"Windows"', '"macOS"', '"Linux"'];
  const selectedVersion = chromeVersions[Math.floor(Math.random() * chromeVersions.length)];
  const selectedLanguage = languages[Math.floor(Math.random() * languages.length)];
  const selectedPlatform = platforms[Math.floor(Math.random() * platforms.length)];

  return {
    'User-Agent': getRandomUserAgent(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': selectedLanguage,
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Ch-Ua': `"Chromium";v="${selectedVersion.version}", "Not/A)Brand";v="24", ${selectedVersion.brand}`,
    'Sec-Ch-Ua-Mobile': Math.random() > 0.5 ? '?1' : '?0',
    'Sec-Ch-Ua-Platform': selectedPlatform,
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1'
  };
}

function getRandomUserAgent() {
  const browsers = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  ];
  return browsers[Math.floor(Math.random() * browsers.length)];
}

async function setupPage(page, url, proxy = null) {
  const headers = getRandomHeaders();
  await page.setExtraHTTPHeaders(headers);
  
  // Randomize viewport size with more variation
  const width = 1920 + Math.floor(Math.random() * 200);
  const height = 1080 + Math.floor(Math.random() * 200);
  await page.setViewport({ 
    width,
    height,
    deviceScaleFactor: 1 + Math.random(),
    hasTouch: Math.random() > 0.8,
    isLandscape: Math.random() > 0.1,
    isMobile: Math.random() > 0.9
  });

  // Enhanced fingerprint spoofing
  await page.evaluateOnNewDocument(() => {
    // Hide webdriver
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    
    // Spoof WebGL
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
      if (parameter === 37445) return 'Intel Open Source Technology Center';
      if (parameter === 37446) return 'Mesa DRI Intel(R) HD Graphics 520';
      return getParameter.call(this, parameter);
    };

    // Modify canvas fingerprint
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function() {
      const original = originalToDataURL.apply(this, arguments);
      return original.replace(/[a-z0-9]{20,}/, val => 
        val.slice(0, 10) + 'a'.repeat(val.length - 10)
      );
    };

    // Fake plugins with more variation
    const plugins = [
      { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
      { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
      { name: 'Native Client', filename: 'internal-nacl-plugin' }
    ];
    Object.defineProperty(navigator, 'plugins', {
      get: () => plugins
    });

    // Enhanced Chrome properties
    window.chrome = {
      app: {
        InstallState: {
          DISABLED: 'DISABLED',
          INSTALLED: 'INSTALLED',
          NOT_INSTALLED: 'NOT_INSTALLED'
        },
        RunningState: {
          CANNOT_RUN: 'CANNOT_RUN',
          READY_TO_RUN: 'READY_TO_RUN',
          RUNNING: 'RUNNING'
        },
        getDetails: function() {},
        getIsInstalled: function() {},
        installState: function() {},
        isInstalled: false,
        runningState: function() {}
      },
      runtime: {
        OnInstalledReason: {
          CHROME_UPDATE: 'chrome_update',
          INSTALL: 'install',
          SHARED_MODULE_UPDATE: 'shared_module_update',
          UPDATE: 'update'
        },
        PlatformArch: {
          ARM: 'arm',
          ARM64: 'arm64',
          MIPS: 'mips',
          MIPS64: 'mips64',
          X86_32: 'x86-32',
          X86_64: 'x86-64'
        },
        PlatformNaclArch: {
          ARM: 'arm',
          MIPS: 'mips',
          MIPS64: 'mips64',
          X86_32: 'x86-32',
          X86_64: 'x86-64'
        },
        PlatformOs: {
          ANDROID: 'android',
          CROS: 'cros',
          LINUX: 'linux',
          MAC: 'mac',
          OPENBSD: 'openbsd',
          WIN: 'win'
        },
        RequestUpdateCheckStatus: {
          NO_UPDATE: 'no_update',
          THROTTLED: 'throttled',
          UPDATE_AVAILABLE: 'update_available'
        }
      }
    };

    // Override permissions with more sophistication
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );
  });

  // Disable resource blocking for images, media, and fonts for this site
  await page.setRequestInterception(true);
  
  const blockedDomains = [
    'datadome.co',
    'anti-bot.baidu.com',
    'akamaized.net',
    'cloudflare-challenge',
    'perimeterx.net',
    'captcha-delivery.com',
    'hcaptcha.com',
    'recaptcha.net',
    'funcaptcha.com',
    'imperva.com'
  ];

  page.on('request', request => {
    const url = request.url().toLowerCase();
    // Only block known anti-bot/captcha domains
    if (blockedDomains.some(domain => url.includes(domain))) {
      request.abort();
      return;
    }
    request.continue({
      headers: {
        ...request.headers(),
        ...getRandomHeaders()
      }
    });
  });
}

async function handleBlockingScenarios(page) {
  const blockingSelectors = {
    cloudflare: ['#challenge-running', '.cf-browser-verification', '#cf-please-wait'],
    captcha: ['.g-recaptcha', '.h-captcha', '.challenge-container', '#px-captcha'],
    general: ['.robot-verification', '.bot-check', '#bot-handler']
  };

  for (const [type, selectors] of Object.entries(blockingSelectors)) {
    for (const selector of selectors) {
      if (await page.$(selector)) {
        // Take screenshot for debugging
        await page.screenshot({ 
          path: `blocked-${type}-${Date.now()}.png`,
          fullPage: true 
        });
        throw new Error(`${type.toUpperCase()}_CHALLENGE_DETECTED`);
      }
    }
  }
}

async function genericScraper(browser, scraperConfig) {
  const page = await browser.newPage();
  await setupPage(page, scraperConfig.source);

  try {
    await page.goto(scraperConfig.source, { waitUntil: 'networkidle0', timeout: 30000 });
    await handleBlockingScenarios(page);
    await randomDelay();

    // Extract content using the provided selector or default to body
    const selector = scraperConfig.selectors?.main || 'body';
    const content = await page.evaluate((sel) => {
      function getVisibleText(element) {
        if (!element) return '';
        
        // Get all text nodes
        const walker = document.createTreeWalker(
          element,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        
        let text = '';
        let node;
        while (node = walker.nextNode()) {
          // Only include text that is visible
        const style = window.getComputedStyle(element);
          if (style.display !== 'none' && style.visibility !== 'hidden') {
            text += node.textContent.trim() + ' ';
        }
        }
        
        return text.trim();
      }

      const element = document.querySelector(sel);
      if (!element) return null;

      // Extract structured data
      const data = {
        text: getVisibleText(element),
        html: element.innerHTML,
        metadata: {}
      };

      // Extract company information
      const extractInfo = (text, pattern) => {
        const match = text.match(new RegExp(pattern, 'i'));
        return match ? match[1].trim() : null;
      };

      // Extract common company information patterns
      data.metadata = {
        name: extractInfo(data.text, /(?:company|société|entreprise|name|nom)\s*:?\s*([^\n]+)/i),
        address: extractInfo(data.text, /(?:address|adresse)\s*:?\s*([^\n]+)/i),
        phone: extractInfo(data.text, /(?:tel|phone|téléphone)\s*:?\s*([^\n]+)/i),
        email: extractInfo(data.text, /(?:email|e-mail|mail)\s*:?\s*([^\n]+)/i),
        website: extractInfo(data.text, /(?:website|site web|site)\s*:?\s*([^\n]+)/i),
        sector: extractInfo(data.text, /(?:sector|secteur)\s*:?\s*([^\n]+)/i),
        country: extractInfo(data.text, /(?:country|pays)\s*:?\s*([^\n]+)/i)
      };

    return data;
    }, selector);

    if (!content) {
      throw new Error('No content found with the provided selector');
    }

    return [{
      nom: scraperConfig.name,
      contenu: JSON.stringify(content),
      lien: scraperConfig.source,
      metadata: content.metadata
    }];

  } catch (error) {
    logger.error(`Error in genericScraper: ${error.message}`);
    throw error;
  } finally {
    await page.close();
  }
}

module.exports = {
  genericScraper
};
