# Africa Venture Harvest Scraper Backend

This backend service runs web scrapers and stores the data in Supabase.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file based on `.env.example` and add your Supabase credentials:
   ```
   PORT=4000
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_supabase_service_role_key
   ```
   
   > Note: Use the Supabase **service role key** for the backend, not the anon key.

3. Start the development server:
   ```
   npm run dev
   ```

## API Endpoints

### Run a Scraper
```
POST /api/scrapers/run/:id
```
- Starts a scraper job with the given scraper ID
- Returns 202 Accepted response if the job was started successfully

### Check Scraper Status
```
GET /api/scrapers/status/:id
```
- Returns the current status of a scraper

## Adding New Scrapers

1. Create a new scraper implementation in the `src/scrapers` directory
2. Add the implementation to the `executeScraper` function in `src/services/scraperService.js`

## Deployment

For production deployment:

1. Build and run the Docker container:
   ```
   docker build -t africa-venture-scraper-backend .
   docker run -p 4000:4000 --env-file .env africa-venture-scraper-backend
   ```

2. Or deploy to a service like Heroku, Railway, or DigitalOcean App Platform.