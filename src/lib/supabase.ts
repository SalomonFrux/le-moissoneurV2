import { createClient } from '@supabase/supabase-js';

// Replace process.env with import.meta.env for Vite compatibility
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(`
    Missing Supabase env vars. Ensure they're in:
    /Users/salomonks/Documents/afircScrapper/.env.local
  `);
}

export const supabase = createClient(supabaseUrl, supabaseKey);