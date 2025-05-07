import { supabase } from '../lib/supabase';

export interface Scraper {
  id: string;
  name: string;
  description?: string;
  url?: string;
  type?: 'generic' | 'news';
  status?: 'active' | 'inactive' | 'error' | 'running';
  last_run?: string;
  created_at?: string;
}

/**
 * Fetch all scrapers from the database
 */
export async function getScrapers(): Promise<Scraper[]> {
  const { data, error } = await supabase
    .from('scrapers')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching scrapers:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Get a single scraper by ID
 */
export async function getScraperById(id: string): Promise<Scraper | null> {
  const { data, error } = await supabase
    .from('scrapers')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching scraper with ID ${id}:`, error);
    throw error;
  }
  
  return data;
}

/**
 * Create a new scraper
 */
// Ensure the `selectors` field is saved as JSON in the database
export async function createScraper(scraper: Omit<Scraper, 'id' | 'created_at'>): Promise<Scraper> {
  const { data, error } = await supabase
    .from('scrapers')
    .insert([{ ...scraper, selectors: JSON.stringify(scraper.selectors) }])
    .select()
    .single();

  if (error) {
    console.error('Error creating scraper:', error);
    throw error;
  }

  return data;
}

/**
 * Update an existing scraper
 */
export async function updateScraper(id: string, updates: Partial<Scraper>): Promise<Scraper> {
  const { data, error } = await supabase
    .from('scrapers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating scraper with ID ${id}:`, error);
    throw error;
  }
  
  return data;
}

/**
 * Delete a scraper
 */
export async function deleteScraper(id: string): Promise<void> {
  const { error } = await supabase
    .from('scrapers')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting scraper with ID ${id}:`, error);
    throw error;
  }
}