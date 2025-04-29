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