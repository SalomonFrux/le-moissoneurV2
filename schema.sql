-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (comment these out if you want to keep existing data)
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS scraped_data CASCADE;
DROP TABLE IF EXISTS scrapers CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- Create scrapers table
CREATE TABLE scrapers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    source TEXT NOT NULL,
    status TEXT DEFAULT 'idle',
    type TEXT DEFAULT 'playwright',
    frequency TEXT DEFAULT 'manual',
    country TEXT DEFAULT 'Aucune info' NOT NULL,
    selectors JSONB DEFAULT '{"main": null}'::jsonb,
    last_run TIMESTAMP WITH TIME ZONE,
    data_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT valid_frequency CHECK (frequency IN ('manual', 'daily', 'weekly', 'monthly'))
);

-- Create scraped_data table with French column names
CREATE TABLE scraped_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scraper_id UUID REFERENCES scrapers(id) ON DELETE CASCADE,
    nom TEXT,
    contenu TEXT,
    lien TEXT,
    secteur TEXT,
    pays TEXT,
    source TEXT,
    site_web TEXT,
    email TEXT,
    telephone TEXT,
    adresse TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT unique_entry UNIQUE (scraper_id, nom, pays, source)
);

-- Optional: Create companies table for data aggregation
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    sector TEXT NOT NULL,
    source TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT unique_company UNIQUE (name, country, source)
);

-- Add comments
COMMENT ON TABLE scrapers IS 'Configuration des scrapers';
COMMENT ON TABLE scraped_data IS 'Données récupérées par les scrapers';
COMMENT ON TABLE companies IS 'Table optionnelle pour l''agrégation des données';

-- Comments for scrapers table
COMMENT ON COLUMN scrapers.name IS 'Nom du scraper';
COMMENT ON COLUMN scrapers.source IS 'URL source du scraper';
COMMENT ON COLUMN scrapers.status IS 'État du scraper (idle, running, completed, error)';
COMMENT ON COLUMN scrapers.type IS 'Type de scraper (playwright, puppeteer)';
COMMENT ON COLUMN scrapers.frequency IS 'Fréquence de scraping: manual, daily, weekly, monthly';
COMMENT ON COLUMN scrapers.country IS 'Pays ciblé par le scraper';
COMMENT ON COLUMN scrapers.selectors IS 'Sélecteurs CSS pour le scraping (format JSON)';
COMMENT ON COLUMN scrapers.last_run IS 'Dernière exécution du scraper';
COMMENT ON COLUMN scrapers.data_count IS 'Nombre d''entrées collectées';
COMMENT ON COLUMN scrapers.created_at IS 'Date de création du scraper';

-- Comments for scraped_data table
COMMENT ON COLUMN scraped_data.nom IS 'Nom de l''entreprise';
COMMENT ON COLUMN scraped_data.contenu IS 'Contenu brut extrait';
COMMENT ON COLUMN scraped_data.lien IS 'Lien vers la source';
COMMENT ON COLUMN scraped_data.secteur IS 'Secteur d''activité';
COMMENT ON COLUMN scraped_data.pays IS 'Pays de l''entreprise';
COMMENT ON COLUMN scraped_data.source IS 'Source des données';
COMMENT ON COLUMN scraped_data.site_web IS 'Site web de l''entreprise';
COMMENT ON COLUMN scraped_data.email IS 'Email de contact';
COMMENT ON COLUMN scraped_data.telephone IS 'Numéro de téléphone';
COMMENT ON COLUMN scraped_data.adresse IS 'Adresse physique';
COMMENT ON COLUMN scraped_data.metadata IS 'Métadonnées additionnelles (format JSON)';
COMMENT ON COLUMN scraped_data.created_at IS 'Date de création de l''entrée';
COMMENT ON COLUMN scraped_data.updated_at IS 'Date de dernière modification';

-- Comments for companies table
COMMENT ON COLUMN companies.name IS 'Nom de l''entreprise';
COMMENT ON COLUMN companies.country IS 'Pays de l''entreprise';
COMMENT ON COLUMN companies.sector IS 'Secteur d''activité';
COMMENT ON COLUMN companies.source IS 'Source des données';
COMMENT ON COLUMN companies.created_at IS 'Date de création de l''entrée';
COMMENT ON COLUMN companies.updated_at IS 'Date de dernière modification';

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_scraped_data_updated_at
    BEFORE UPDATE ON scraped_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scrapers_updated_at
    BEFORE UPDATE ON scrapers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_scraped_data_scraper_id ON scraped_data(scraper_id);
CREATE INDEX idx_scraped_data_nom ON scraped_data(nom);
CREATE INDEX idx_scraped_data_pays ON scraped_data(pays);
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_country ON companies(country);

-- Enable Row Level Security (RLS)
ALTER TABLE scrapers ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraped_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust these according to your authentication needs)
CREATE POLICY "Enable read access for all users" ON scrapers
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable read access for all users" ON scraped_data
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable read access for all users" ON companies
    FOR SELECT
    TO authenticated
    USING (true);

-- Grant necessary permissions (adjust according to your needs)
GRANT ALL ON scrapers TO authenticated;
GRANT ALL ON scraped_data TO authenticated;
GRANT ALL ON companies TO authenticated;

-- Create statistics summary function
CREATE OR REPLACE FUNCTION get_statistics_summary()
RETURNS TABLE (
    total_companies BIGINT,
    companies_change INTEGER,
    total_countries INTEGER,
    total_sectors INTEGER,
    monthly_growth INTEGER,
    countries_label TEXT,
    sectors_label TEXT,
    growth_label TEXT
) AS $$
DECLARE
    last_month_count INTEGER;
    current_month_count INTEGER;
BEGIN
    -- Get total entries from scraped_data (all records)
    SELECT COUNT(*) INTO total_companies FROM scraped_data;
    
    -- Get unique countries and sectors (including nulls and 'Aucune donnée')
    SELECT COUNT(DISTINCT COALESCE(pays, 'Aucune donnée')) INTO total_countries 
    FROM scraped_data;
    
    SELECT COUNT(DISTINCT COALESCE(secteur, 'Aucune donnée')) INTO total_sectors 
    FROM scraped_data;
    
    -- Calculate monthly growth (all records)
    SELECT COUNT(*) INTO last_month_count
    FROM scraped_data 
    WHERE created_at >= date_trunc('month', current_date - interval '1 month')
    AND created_at < date_trunc('month', current_date);
    
    SELECT COUNT(*) INTO current_month_count
    FROM scraped_data 
    WHERE created_at >= date_trunc('month', current_date)
    AND created_at < date_trunc('month', current_date + interval '1 month');
    
    -- Calculate percentage changes
    companies_change := CASE 
        WHEN last_month_count = 0 THEN 100
        ELSE ((current_month_count - last_month_count)::FLOAT / last_month_count * 100)::INTEGER
    END;
    
    monthly_growth := CASE 
        WHEN last_month_count = 0 THEN 100
        ELSE ((current_month_count - last_month_count)::FLOAT / last_month_count * 100)::INTEGER
    END;
    
    -- Set labels
    countries_label := CASE 
        WHEN total_countries = 0 THEN 'Aucun pays enregistré'
        WHEN total_countries = 1 THEN '1 pays enregistré'
        ELSE total_countries || ' pays enregistrés'
    END;
    
    sectors_label := CASE 
        WHEN total_sectors = 0 THEN 'Aucun secteur enregistré'
        WHEN total_sectors = 1 THEN '1 secteur enregistré'
        ELSE total_sectors || ' secteurs enregistrés'
    END;
    
    growth_label := 'Croissance mensuelle';
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_statistics_summary() TO authenticated;

-- Add updated_at column to scrapers table
ALTER TABLE scrapers
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();


-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add initial admin user (password: extracteur2025@)
INSERT INTO users (email, password_hash, role)
VALUES (
    'extracteur@sikso.com',
    '$2b$10$O4eivaV8lgDoHTm2tgVsLeaovBOWRRN95s95SeANk6RP8Q3FoXkEW',
    'admin'
) ON CONFLICT (email) DO NOTHING; 