import { supabase } from '../lib/supabase';

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

/**
 * Fetch all scraped data
 */
export async function getAllData(limit = 100): Promise<ScrapedData[]> {
  const { data, error } = await supabase
    .from('scraped_data')
    .select('*')
    .order('scraped_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching scraped data:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Fetch data for a specific scraper
 */
export async function getDataByScraperId(scraperId: string, limit = 100): Promise<ScrapedData[]> {
  const { data, error } = await supabase
    .from('scraped_data')
    .select('*')
    .eq('scraper_id', scraperId)
    .order('scraped_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error(`Error fetching data for scraper ${scraperId}:`, error);
    throw error;
  }
  
  return data || [];
}

/**
 * Get a single data item by ID
 */
export async function getDataById(id: string): Promise<ScrapedData | null> {
  const { data, error } = await supabase
    .from('scraped_data')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching data with ID ${id}:`, error);
    throw error;
  }
  
  return data;
}

/**
 * Store new scraped data
 */
export async function storeScrapedData(
  scrapedData: Omit<ScrapedData, 'id' | 'created_at'>
): Promise<ScrapedData> {
  const { data, error } = await supabase
    .from('scraped_data')
    .insert([scrapedData])
    .select()
    .single();
  
  if (error) {
    console.error('Error storing scraped data:', error);
    throw error;
  }
  
  return data;
}

/**
 * Delete scraped data
 */
export async function deleteScrapedData(id: string): Promise<void> {
  const { error } = await supabase
    .from('scraped_data')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting data with ID ${id}:`, error);
    throw error;
  }
}