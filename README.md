# Africa Venture Harvest Scraper

A web application for managing and running web scrapers to collect data from African business and investment websites.

## Project Structure

- `/src` - Frontend application (React + TypeScript)
- `/backend` - Node.js backend for running scrapers
- `/public` - Static assets

## Setup

### Frontend

1. Install dependencies:
   ```
   npm install in frontend
   npm install in backend
   npm install in root
   cd backend && npm install pdfkit
   cd backend && npm install @supabase/supabase-js dotenv winston
   npm install @supabase/supabase-js dotenv winston
   cd frontend && npm install framer-motion
   npm install axios
   npm install jspdf html2canvas
   rm -rf node_modules/.vite
   npm run dev
   iF ERROR PERSISTANT, TRY THIS:
  rm -rf node_modules package-lock.json
  npm install
  npm run dev

   And it will all work fine.

   ```

2. Copy `.env.local.example` to `.env.local` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_BASE_URL=http://localhost:4000/api
   ```

3. Start the development server:
   ```
   npm run dev
   ```

### Backend

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Copy `.env.example` to `.env` and add your Supabase credentials:
   ```
   PORT=4000
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_supabase_service_role_key
   ```
   
   > Note: Use the Supabase **service role key** for the backend, not the anon key.

4. Start the development server:
   ```
   npm run dev
   ```

## Database Setup

Create the following tables in your Supabase database:

### Scrapers Table

```sql
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
    CONSTRAINT valid_frequency CHECK (frequency IN ('manual', 'daily', 'weekly', 'monthly'))
);

-- Create scraped_data table with French column names
CREATE TABLE scraped_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scraper_id UUID REFERENCES scrapers(id) ON DELETE CASCADE,
    nom TEXT,
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


ALTER TABLE scraped_data ADD COLUMN IF NOT EXISTS contenu TEXT; ALTER TABLE scraped_data ADD COLUMN IF NOT EXISTS lien TEXT; COMMENT ON COLUMN scraped_data.contenu IS 'Contenu brut extrait'; COMMENT ON COLUMN scraped_data.lien IS 'Lien vers la source'



```

## Features

- User authentication via Supabase Auth
- Create, manage, and run web scrapers
- View and search scraped data
- Specialized scrapers for different types of websites

## How It Works

1. Users create scrapers in the frontend, specifying URLs and scraper types
2. When a user clicks "Run Scraper", a request is sent to the backend API
3. The backend runs the scraper using Puppeteer, a headless browser
4. Scraped data is stored in Supabase
5. The frontend displays the scraped data and scraper status

## Architecture

```
┌────────────┐     ┌────────────┐     ┌────────────┐
│            │     │            │     │            │
│  React     │     │  Node.js   │     │  Supabase  │
│  Frontend  │────▶│  Backend   │────▶│  Database  │
│            │     │            │     │            │
└────────────┘     └────────────┘     └────────────┘
       ▲                                    │
       │                                    │
       └────────────────────────────────────┘
```

## Deployment

### Frontend

The frontend can be deployed to Vercel, Netlify, or any static hosting service.

### Backend

The backend can be deployed using the provided Dockerfile:

```
cd backend
docker build -t africa-venture-scraper-backend .
docker run -p 4000:4000 --env-file .env africa-venture-scraper-backend
```

Or deploy to a service like Heroku, Railway, or DigitalOcean App Platform.



# Africa Venture Harvest Scraper Project Tree
A web application for managing and running web scrapers to collect data from African business and investment websites.


```
SamExtract
├─ README-FULLSTACK.md
├─ README.md
├─ backend
│  ├─ Dockerfile
│  ├─ README.md
│  ├─ package.json
│  └─ src
│     ├─ app.js
│     ├─ controllers
│     │  ├─ companyController.js
│     │  └─ scraperController.js
│     ├─ db
│     │  └─ supabase.js
│     ├─ index.js
│     ├─ routes
│     │  ├─ scrapedDataRoutes.js
│     │  └─ scraperRoutes.js
│     ├─ scrapers
│     │  ├─ genericScraper.js
│     │  ├─ newsPortalScraper.js
│     │  └─ playwrightScraper.js
│     ├─ services
│     │  └─ scraperService.js
│     └─ utils
│        └─ logger.js
├─ frontend
│  ├─ README.md
│  ├─ components.json
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ package.json
│  ├─ postcss.config.js
│  ├─ public
│  │  ├─ favicon.ic
│  │  ├─ placeholder.svg
│  │  └─ robots.txt
│  ├─ src
│  │  ├─ App.css
│  │  ├─ App.tsx
│  │  ├─ components
│  │  │  ├─ Header.tsx
│  │  │  ├─ MobileSidebar.tsx
│  │  │  ├─ Sidebar.tsx
│  │  │  ├─ dashboard
│  │  │  │  ├─ Dashboard.tsx
│  │  │  │  ├─ DataPage.tsx
│  │  │  │  ├─ DataTable.tsx
│  │  │  │  ├─ ScraperCard.tsx
│  │  │  │  ├─ ScrapersPage.tsx
│  │  │  │  └─ StatsCard.tsx
│  │  │  ├─ enrichment
│  │  │  │  └─ EnrichmentPage.tsx
│  │  │  ├─ settings
│  │  │  │  └─ ParametersPage.tsx
│  │  │  ├─ statistics
│  │  │  │  ├─ CollectionTrends.tsx
│  │  │  │  ├─ GeographicDistribution.tsx
│  │  │  │  ├─ SectorDistribution.tsx
│  │  │  │  ├─ SourceComparison.tsx
│  │  │  │  └─ StatisticsPage.tsx
│  │  │  └─ ui
│  │  │     ├─ accordion.tsx
│  │  │     ├─ alert-dialog.tsx
│  │  │     ├─ alert.tsx
│  │  │     ├─ aspect-ratio.tsx
│  │  │     ├─ avatar.tsx
│  │  │     ├─ badge.tsx
│  │  │     ├─ breadcrumb.tsx
│  │  │     ├─ button.tsx
│  │  │     ├─ calendar.tsx
│  │  │     ├─ card.tsx
│  │  │     ├─ carousel.tsx
│  │  │     ├─ chart.tsx
│  │  │     ├─ checkbox.tsx
│  │  │     ├─ collapsible.tsx
│  │  │     ├─ command.tsx
│  │  │     ├─ context-menu.tsx
│  │  │     ├─ dialog.tsx
│  │  │     ├─ drawer.tsx
│  │  │     ├─ dropdown-menu.tsx
│  │  │     ├─ form.tsx
│  │  │     ├─ hover-card.tsx
│  │  │     ├─ input-otp.tsx
│  │  │     ├─ input.tsx
│  │  │     ├─ label.tsx
│  │  │     ├─ menubar.tsx
│  │  │     ├─ navigation-menu.tsx
│  │  │     ├─ pagination.tsx
│  │  │     ├─ popover.tsx
│  │  │     ├─ progress.tsx
│  │  │     ├─ radio-group.tsx
│  │  │     ├─ resizable.tsx
│  │  │     ├─ scroll-area.tsx
│  │  │     ├─ select.tsx
│  │  │     ├─ separator.tsx
│  │  │     ├─ sheet.tsx
│  │  │     ├─ sidebar.tsx
│  │  │     ├─ skeleton.tsx
│  │  │     ├─ slider.tsx
│  │  │     ├─ sonner.tsx
│  │  │     ├─ switch.tsx
│  │  │     ├─ table.tsx
│  │  │     ├─ tabs.tsx
│  │  │     ├─ textarea.tsx
│  │  │     ├─ toast.tsx
│  │  │     ├─ toaster.tsx
│  │  │     ├─ toggle-group.tsx
│  │  │     ├─ toggle.tsx
│  │  │     ├─ tooltip.tsx
│  │  │     └─ use-toast.ts
│  │  ├─ hooks
│  │  │  ├─ use-mobile.tsx
│  │  │  └─ use-toast.ts
│  │  ├─ index.css
│  │  ├─ lib
│  │  │  └─ utils.ts
│  │  ├─ main.tsx
│  │  ├─ pages
│  │  │  ├─ Index.tsx
│  │  │  └─ NotFound.tsx
│  │  ├─ services
│  │  │  ├─ dataService.ts
│  │  │  └─ scraperService.ts
│  │  └─ vite-env.d.ts
│  ├─ tailwind.config.ts
│  ├─ tsconfig.app.json
│  ├─ tsconfig.json
│  ├─ tsconfig.node.json
│  └─ vite.config.ts
├─ package.json
├─ package.json.updates
├─ schema.sql
└─ src
   ├─ App.tsx
   ├─ components
   │  ├─ Auth.tsx
   │  └─ dashboard
   │     ├─ Dashboard.tsx
   │     ├─ DataPage.tsx
   │     ├─ DataTable.tsx
   │     ├─ ScraperCard.tsx
   │     ├─ ScrapersPage.tsx
   │     └─ StatsCard.tsx
   ├─ lib
   │  └─ supabase.ts
   ├─ services
   │  ├─ dataService.ts
   │  └─ scraperService.ts
   ├─ types.ts
   └─ vite-env.d.ts

```

Enrichment Page is a page that allows you to enrich the data of a company.
Implementation of the enrichment page is in the enrichment folder:
Here's a comprehensive task list to implement the complete enrichment functionality:

## 1. Database Setup (Already Done ✓)
- ✓ Create `enrichment_tasks` table
- ✓ Set up basic schema

## 2. Backend Implementation

### A. Data Models and Types
```typescript
- Create types/interfaces for:
  - EnrichmentTask
  - EnrichmentSource
  - EnrichmentResult
  - EnrichmentConfig
```

### B. API Endpoints
1. Tasks Management:
```typescript
- POST /api/enrichment/tasks (create new task)
- PUT /api/enrichment/tasks/:id (update task status)
- DELETE /api/enrichment/tasks/:id (delete task)
- GET /api/enrichment/tasks/:id/progress (get task progress)
```

2. Sources Management:
```typescript
- GET /api/enrichment/sources (list available sources)
- POST /api/enrichment/sources (add new source)
- PUT /api/enrichment/sources/:id (update source config)
```

### C. Enrichment Services
1. Source Connectors:
```typescript
- LinkedIn API connector
- FinData API connector
- OpenCorporates connector
- Generic API connector interface
```

2. Enrichment Engine:
```typescript
- Task queue management
- Rate limiting
- Error handling
- Progress tracking
- Data validation
```

3. Data Processing:
```typescript
- Data matching algorithms
- Data merging logic
- Conflict resolution
```

## 3. Frontend Implementation

### A. Components
1. Task Creation:
```typescript
- Create EnrichmentTaskModal component
- Add form for task configuration
- Implement source selection
- Add validation
```

2. Task Management:
```typescript
- Create TaskList component
- Add TaskCard component
- Implement task controls (pause/resume/delete)
- Add progress indicators
```

3. Source Configuration:
```typescript
- Create SourceConfig component
- Add API key management
- Add source testing functionality
```

4. Results View:
```typescript
- Create EnrichmentResults component
- Add data preview
- Implement export functionality
```

### B. State Management
```typescript
- Add enrichment state slice
- Implement task tracking
- Add source configuration state
- Handle real-time updates
```

### C. API Integration
```typescript
- Create enrichment API service
- Add WebSocket connection for real-time updates
- Implement error handling
```

## 4. Integration Features

### A. Real-time Updates
```typescript
- WebSocket connection setup
- Progress updates
- Status changes
- Error notifications
```

### B. Background Jobs
```typescript
- Task scheduler
- Queue management
- Retry mechanism
- Error recovery
```

### C. Monitoring
```typescript
- Task progress tracking
- Error logging
- Performance metrics
- Usage statistics
```

## 5. Security & Performance

### A. Security
```typescript
- API key encryption
- Rate limiting
- Access control
- Input validation
```

### B. Performance
```typescript
- Caching strategy
- Batch processing
- Database optimization
- Connection pooling
```

## 6. Testing & Documentation

### A. Testing
```typescript
- Unit tests for services
- Integration tests
- API endpoint tests
- UI component tests
```

### B. Documentation
```typescript
- API documentation
- Setup guide
- Usage examples
- Troubleshooting guide
```

## Suggested Implementation Order:

1. **Phase 1 - Basic Infrastructure**
   - Backend API endpoints
   - Basic frontend components
   - Task creation/management

2. **Phase 2 - Core Functionality**
   - Source connectors
   - Enrichment engine
   - Data processing

3. **Phase 3 - Enhanced Features**
   - Real-time updates
   - Background jobs
   - Monitoring

4. **Phase 4 - Polish**
   - Security improvements
   - Performance optimization
   - Testing
   - Documentation

Phase 1 - Basic Infrastructure
Backend API endpoints
Basic frontend components
Task creation/management
Phase 2 - Core Functionality
Source connectors
Enrichment engine
Data processing
Phase 3 - Enhanced Features
Real-time updates
Background jobs
Monitoring
Phase 4 - Polish
Security improvements
Performance optimization
Testing
Documentation

