import axios from 'axios';
import { API_URL } from '../config';

export interface DashboardStats {
  totalEnterprises: number;
  countriesCount: number;
  sourcesCount: number;
  enrichmentRate: number;
}

export interface ScraperStatus {
  id: string;
  name: string;
  lastRun: string;
  status: string;
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    try {
      const response = await axios.get(`${API_URL}/api/dashboard/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  async getScraperStatuses(): Promise<ScraperStatus[]> {
    try {
      const response = await axios.get(`${API_URL}/api/dashboard/scraper-statuses`);
      return response.data;
    } catch (error) {
      console.error('Error fetching scraper statuses:', error);
      throw error;
    }
  }
};
