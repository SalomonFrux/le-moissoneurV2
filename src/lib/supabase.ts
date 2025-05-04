import { createClient } from '@supabase/supabase-js';

// Use process.env (Node-style) instead of import.meta.env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(`
    Missing Supabase env vars. Ensure they're in:
    /Users/salomonks/Documents/afircScrapper/.env.local
  `);
}

export const supabase = createClient(supabaseUrl, supabaseKey);