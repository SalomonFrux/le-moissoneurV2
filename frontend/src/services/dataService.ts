import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface ScrapedEntry {
  id: string;
  scraper_id: string;
  nom: string;
  secteur: string;
  pays: string;
  source: string;
  site_web: string;
  email: string;
  telephone: string;
  adresse: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  sector: string;
  country: string;
  source: string;
  scraped_entries?: ScrapedEntry[];
  created_at: string;
  updated_at: string;
}

export interface Scraper {
  id: string;
  name: string;
  source: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  type: 'playwright' | 'puppeteer';
  frequency: 'manual' | 'daily' | 'weekly' | 'monthly';
  country: string;
  selectors: Record<string, any>;
  last_run: string | null;
  data_count: number;
  created_at: string;
}

export const dataService = {
  async getAllScrapers(): Promise<Scraper[]> {
    try {
      const response = await axios.get<Scraper[]>(`${API_URL}/api/scrapers`);
      return response.data;
    } catch (error) {
      console.error('Error fetching scrapers:', error);
      throw error;
    }
  },

  async runScraper(id: string): Promise<void> {
    try {
      await axios.post(`${API_URL}/api/scrapers/run/${id}`);
    } catch (error) {
      console.error('Error running scraper:', error);
      throw error;
    }
  },

  async fetchCompanies(): Promise<Company[]> {
    try {
      const response = await axios.get<Company[]>(`${API_URL}/api/scrapers/companies`);
      return response.data;
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  },

  async updateCompany(id: string, data: Partial<Company>): Promise<Company> {
    try {
      const response = await axios.put<Company>(`${API_URL}/api/companies/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  },

  async fetchScrapedData(scraperId: string): Promise<ScrapedEntry[]> {
    try {
      const response = await axios.get<ScrapedEntry[]>(`${API_URL}/api/scrapers/${scraperId}/data`);
      return response.data;
    } catch (error) {
      console.error('Error fetching scraped data:', error);
      throw error;
    }
  },

  async fetchAllScrapedData(): Promise<ScrapedEntry[]> {
    try {
      const response = await axios.get<ScrapedEntry[]>(`${API_URL}/api/scraped-data`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all scraped data:', error);
      throw error;
    }
  },

  async updateScrapedEntry(id: string, data: Partial<ScrapedEntry>): Promise<ScrapedEntry> {
    try {
      const response = await axios.put<ScrapedEntry>(`${API_URL}/api/scraped-data/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating scraped entry:', error);
      throw error;
    }
  },

  async deleteScrapedEntry(id: string): Promise<void> {
    try {
      await axios.delete(`${API_URL}/api/scraped-data/${id}`);
    } catch (error) {
      console.error('Error deleting scraped entry:', error);
      throw error;
    }
  }
}; 