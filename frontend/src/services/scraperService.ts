import { ScraperData } from '@/components/dashboard/ScraperCard';

export async function getAllScrapers(): Promise<ScraperData[]> {
  const response = await fetch('/api/scrapers');
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch scrapers' }));
    throw new Error(error.message || 'Failed to fetch scrapers');
  }
  
  return response.json();
}

export async function runScraper(id: string): Promise<ScraperData> {
  if (!id) {
    throw new Error('Scraper ID is required');
  }

  const response = await fetch(`/api/scrapers/run/${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to run scraper' }));
    throw new Error(error.message || 'Failed to run scraper');
  }
  
  return response.json();
}

export async function getScraperStatus(id: string): Promise<ScraperData> {
  if (!id) {
    throw new Error('Scraper ID is required');
  }

  const response = await fetch(`/api/scrapers/status/${id}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to get scraper status' }));
    throw new Error(error.message || 'Failed to get scraper status');
  }
  
  return response.json();
}

export async function createScraper(data: Partial<ScraperData>): Promise<ScraperData> {
  const response = await fetch('/api/scrapers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create scraper' }));
    throw new Error(error.message || 'Failed to create scraper');
  }
  
  return response.json();
}