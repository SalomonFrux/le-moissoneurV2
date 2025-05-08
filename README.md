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
   npm install
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
    -- Create scrapers table
CREATE TABLE scrapers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    source TEXT NOT NULL,
    status TEXT DEFAULT 'idle',
    last_run TIMESTAMP WITH TIME ZONE,
    data_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create scraped_data table
CREATE TABLE scraped_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scraper_id UUID REFERENCES scrapers(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT,
    url TEXT,
    metadata JSONB,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create companies table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    sector TEXT NOT NULL,
    country TEXT NOT NULL,
    website TEXT,
    linkedin TEXT,
    email TEXT,
    source TEXT NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add comments to explain the columns in companies table
COMMENT ON COLUMN companies.name IS 'Name of the company';
COMMENT ON COLUMN companies.sector IS 'Sector the company operates in';
COMMENT ON COLUMN companies.country IS 'Country where the company is based';
COMMENT ON COLUMN companies.website IS 'Website URL of the company';
COMMENT ON COLUMN companies.linkedin IS 'LinkedIn profile URL of the company';
COMMENT ON COLUMN companies.email IS 'Contact email of the company';
COMMENT ON COLUMN companies.source IS 'Source of the company data';
COMMENT ON COLUMN companies.last_updated IS 'Timestamp of the last update to the company data';

-- Alter scrapers table
ALTER TABLE scrapers 
ADD COLUMN IF NOT EXISTS frequency text DEFAULT 'manual' NOT NULL,
ADD COLUMN IF NOT EXISTS selectors jsonb DEFAULT '{"main": null}'::jsonb,
ADD COLUMN IF NOT EXISTS last_run timestamp with time zone,
ADD CONSTRAINT valid_frequency CHECK (frequency IN ('manual', 'daily', 'weekly', 'monthly'));

-- Add comments to explain the columns in scrapers table
COMMENT ON COLUMN scrapers.frequency IS 'Scraping frequency: manual, daily, weekly, or monthly';
COMMENT ON COLUMN scrapers.selectors IS 'JSON object containing CSS selectors for scraping';
COMMENT ON COLUMN scrapers.last_run IS 'Timestamp of the last successful scrape';

ALTER TABLE scrapers ADD COLUMN type text DEFAULT 'playwright';
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
afircScrapper
├─ .DS_Store
├─ .continue
│  └─ models
│     └─ new-model.yaml
├─ .env.local
├─ .env.local.example
├─ README-FULLSTACK.md
├─ README.md
├─ africa-venture-harvest
│  ├─ .DS_Store
│  ├─ .env
│  ├─ .env.local
│  ├─ README.md
│  ├─ bun.lockb
│  ├─ components.json
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ package-lock.json
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
│  │  │  └─ scraperService.ts
│  │  └─ vite-env.d.ts
│  ├─ tailwind.config.ts
│  ├─ tsconfig.app.json
│  ├─ tsconfig.json
│  ├─ tsconfig.node.json
│  └─ vite.config.ts
├─ backend
│  ├─ .env
│  ├─ .env.example
│  ├─ Dockerfile
│  ├─ README.md
│  ├─ logs
│  │  ├─ combined.log
│  │  └─ error.log
│  ├─ package-lock.json
│  ├─ package.json
│  └─ src
│     ├─ controllers
│     │  └─ scraperController.js
│     ├─ db
│     │  └─ supabase.js
│     ├─ index.js
│     ├─ routes
│     │  └─ scraperRoutes.js
│     ├─ scrapers
│     │  ├─ genericScraper.js
│     │  └─ newsPortalScraper.js
│     ├─ services
│     │  └─ scraperService.js
│     └─ utils
│        └─ logger.js
├─ package-lock.json
├─ package.json
├─ package.json.updates
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
   └─ vite-env.d.ts

```