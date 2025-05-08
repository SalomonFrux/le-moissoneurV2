import { Company } from '@/components/dashboard/DataTable';
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

async function fetchScrapers(): Promise<any[]> {
  const { data, error } = await supabase.from('scrapers').select('*');

  if (error) {
    console.error('Error fetching scrapers:', error);
    throw new Error('Failed to fetch scrapers');
  }

  return data || [];
}

async function fetchCompanies(): Promise<Company[]> {
  const { data, error } = await supabase.from('companies').select('*');

  if (error) {
    console.error('Error fetching companies:', error);
    throw new Error('Failed to fetch companies');
  }

  return data || [];
}

//To be well implemented:
async function fetchEnrichmentTasks(): Promise<Company[]> {
  const { data, error } = await supabase.from('enrichment_tasks').select('*');

  if (error) {
    console.error('Error fetching enrichment tasks:', error);
    throw new Error('Failed to fetch enrichment tasks');
  }

  return data || [];
}

// Fetch collection trends (monthly company count, new companies)
export async function fetchCollectionTrends() {
  const { data, error } = await supabase.rpc('get_collection_trends');
  if (error) throw error;
  return data;
}

// Fetch enrichment rates (monthly enrichment %)
export async function fetchEnrichmentRates() {
  const { data, error } = await supabase.rpc('get_enrichment_rates');
  if (error) throw error;
  return data;
}

// Fetch sector distribution (sector, count, color)
export async function fetchSectorDistribution() {
  const { data, error } = await supabase.rpc('get_sector_distribution');
  if (error) throw error;
  return data;
}

// Fetch top fintech subsectors
export async function fetchFintechSubsectors() {
  const { data, error } = await supabase.rpc('get_fintech_subsectors');
  if (error) throw error;
  return data;
}

// Fetch source comparison (source, company count, completeness, etc.)
export async function fetchSourceComparison() {
  const { data, error } = await supabase.rpc('get_source_comparison');
  if (error) throw error;
  return data;
}

// Fetch geographic distribution (country, company count, investments)
export async function fetchGeographicDistribution() {
  const { data, error } = await supabase.rpc('get_geographic_distribution');
  if (error) throw error;
  return data;
}

// Fetch regional distribution (region, company count)
export async function fetchRegionalDistribution() {
  const { data, error } = await supabase.rpc('get_regional_distribution');
  if (error) throw error;
  return data;
}

// This function needs to be implemented. 
// It should fetch statistics summary from a database or API.
export function fetchStatisticsSummary() {
  // Function implementation
}

export { fetchScrapers, fetchCompanies, fetchEnrichmentTasks };
