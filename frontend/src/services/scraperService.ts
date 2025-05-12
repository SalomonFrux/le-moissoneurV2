import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export interface ScraperData {
  id: string;
  name: string;
  source: string;
  status: 'idle' | 'running' | 'error' | 'completed';
  lastRun?: string;
  dataCount: number;
  selectors?: { main: string };
  frequency: 'daily' | 'weekly' | 'monthly' | 'manual';
  country: string;
  type: 'playwright' | 'puppeteer';
}

export async function getAllScrapers(): Promise<ScraperData[]> {
  try {
    const response = await axios.get<ScraperData[]>(`${API_URL}/api/scrapers`);
    return response.data;
  } catch (error) {
    console.error('Error fetching scrapers:', error);
    throw error;
  }
}

export async function runScraper(id: string): Promise<void> {
  try {
    await axios.post(`${API_URL}/api/scrapers/run/${id}`);
  } catch (error) {
    console.error('Error running scraper:', error);
    throw error;
  }
}

export async function getScraperStatus(id: string): Promise<ScraperData> {
  try {
    const response = await axios.get<ScraperData>(`${API_URL}/api/scrapers/${id}/status`);
    return response.data;
  } catch (error) {
    console.error('Error getting scraper status:', error);
    throw error;
  }
}

export async function createScraper(data: Partial<ScraperData>): Promise<ScraperData> {
  try {
    const response = await axios.post<ScraperData>(`${API_URL}/api/scrapers`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating scraper:', error);
    throw error;
  }
}

export async function deleteScraper(id: string): Promise<void> {
  try {
    await axios.delete(`${API_URL}/api/scrapers/${id}`);
  } catch (error) {
    console.error('Error deleting scraper:', error);
    throw error;
  }
}

export async function updateScraper(id: string, data: Partial<ScraperData>): Promise<ScraperData> {
  try {
    const response = await axios.put<ScraperData>(`${API_URL}/api/scrapers/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating scraper:', error);
    throw error;
  }
}