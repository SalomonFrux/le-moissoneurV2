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
CREATE TABLE scrapers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  url TEXT,
  type TEXT DEFAULT 'generic',
  status TEXT DEFAULT 'inactive',
  last_run TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Scraped Data Table

```sql
CREATE TABLE scraped_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scraper_id UUID REFERENCES scrapers(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  url TEXT,
  metadata JSONB,
  scraped_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
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