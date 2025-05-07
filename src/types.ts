// Shared types for dashboard
export interface Scraper {
  id: string;
  name: string;
  description?: string;
  url?: string;
  status?: string;
  last_run?: string;
  created_at?: string;
}

export interface ScrapedData {
  id: string;
  scraper_id: string;
  title?: string;
  content?: string;
  url?: string;
  metadata?: Record<string, any>;
  scraped_at: string;
  created_at?: string;
}
