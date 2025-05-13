import axios from 'axios';
import { Scraper } from './dataService';

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

export async function getAllScrapers(): Promise<Scraper[]> {
  const response = await axios.get<Scraper[]>(`${API_URL}/api/scrapers`);
  return response.data;
}

export async function runScraper(id: string): Promise<void> {
  await axios.post(`${API_URL}/api/scrapers/run/${id}`);
}

export async function getScraperStatus(id: string): Promise<Scraper> {
  const response = await axios.get<Scraper>(`${API_URL}/api/scrapers/status/${id}`);
  return response.data;
}

export async function createScraper(data: Partial<Scraper>): Promise<Scraper> {
  const response = await axios.post<Scraper>(`${API_URL}/api/scrapers`, data);
  return response.data;
}

export async function deleteScraper(id: string): Promise<void> {
  await axios.delete(`${API_URL}/api/scrapers/${id}`);
}

export async function updateScraper(id: string, data: Partial<Scraper>): Promise<Scraper> {
  const response = await axios.put<Scraper>(`${API_URL}/api/scrapers/${id}`, data);
  return response.data;
}