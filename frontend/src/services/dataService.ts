import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface ScrapedEntry {
  id: number;
  title: string;
  content: string;
  url: string;
  metadata: {
    website?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  scraped_at: string;
}

export interface Company {
  id: number;
  name: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  source: string;
  scraped_entries: ScrapedEntry[];
  created_at: string;
  updated_at: string;
}

export const dataService = {
  async fetchCompanies(): Promise<Company[]> {
    try {
      const response = await axios.get(`${API_URL}/api/scrapers/companies`);
      return response.data;
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  },

  async updateCompany(id: number, data: Partial<Company>): Promise<Company> {
    try {
      const response = await axios.put(`${API_URL}/api/companies/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  }
}; 