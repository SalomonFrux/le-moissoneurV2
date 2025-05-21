# Deployment Guide for Le Moissoneur

This guide will help you deploy the application to Google Cloud Run and Vercel.

## Prerequisites

- Google Cloud SDK installed and configured
- Docker installed (with linux/amd64 platform support for Apple Silicon)
- Access to the Supabase database
- Vercel CLI installed (optional)

## Environment Variables

### Backend Environment Variables

The backend requires the following environment variables to be set:

- `SUPABASE_URL`: The URL of your Supabase instance
- `SUPABASE_KEY`: Your Supabase service role key
- `JWT_SECRET`: Secret key for JWT token generation
- `JWT_EXPIRATION`: Token expiration time (e.g., "24h")

### Frontend Environment Variables

Create a `.env.production` file in the frontend directory with these variables:

```
VITE_API_URL=https://[your-backend-url]
VITE_SUPABASE_URL=https://rbqkvzdzobxbnkjuprhx.supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-key]
```

## Deployment Steps

### 1. Deploy the Frontend to Vercel

#### Option 1: Using the Vercel Dashboard

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your repository
5. Configure the project settings:
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Add environment variables:
   - VITE_API_URL=(your GCP backend URL)
   - VITE_SUPABASE_URL=https://rbqkvzdzobxbnkjuprhx.supabase.co
   - VITE_SUPABASE_ANON_KEY=(your anon key)
7. Click "Deploy"

#### Option 2: Using Vercel CLI

```bash
cd frontend
# Install Vercel CLI if you haven't already
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### 2. Deploy the Backend to Google Cloud Run

#### Step 1: Create a Dockerfile for the backend

Create a `Dockerfile` in the backend directory with the following content:

```dockerfile
FROM node:18-slim

# Install Playwright dependencies
RUN apt-get update && apt-get install -y \
    libwoff1 \
    libopus0 \
    libwebp7 \
    libwebpdemux2 \
    libenchant-2-2 \
    libgudev-1.0-0 \
    libsecret-1-0 \
    libhyphen0 \
    libgdk-pixbuf2.0-0 \
    libegl1 \
    libnotify4 \
    libxslt1.1 \
    libevent-2.1-7 \
    libgles2 \
    libvpx7 \
    libxcomposite1 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libepoxy0 \
    libgtk-3-0 \
    libharfbuzz-icu0 \
    libxshmfence1 \
    chromium \
    fonts-noto-color-emoji \
    fonts-freefont-ttf

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the code
COPY . .

# Install Playwright with Chromium only
RUN npx playwright install chromium --with-deps

# Make sure Playwright can run without GPU
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Expose the port the app runs on
EXPOSE 4000

# Start the app
CMD ["node", "src/index.js"]
```

#### Step 2: Build and push the Docker image

```bash
cd backend

# Build the Docker image for Apple Silicon
docker build --platform linux/amd64 -t gcr.io/samscraper-460319/samscraper-backend:latest .

# Push the image to Google Container Registry
docker push gcr.io/samscraper-460319/samscraper-backend:latest
```

#### Step 3: Deploy to Google Cloud Run

```bash
# Set environment variables
PROJECT_ID=samscraper-460319
REGION=europe-west1
SUPABASE_URL="https://rbqkvzdzobxbnkjuprhx.supabase.co"
SUPABASE_KEY="your-supabase-service-key"
JWT_SECRET="your-jwt-secret"
JWT_EXPIRATION="24h"

# Deploy to Cloud Run with enhanced resources
gcloud run deploy samscraper-backend \
  --image gcr.io/$PROJECT_ID/samscraper-backend:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 4000 \
  --set-env-vars SUPABASE_URL="$SUPABASE_URL",SUPABASE_KEY="$SUPABASE_KEY",JWT_SECRET="$JWT_SECRET",JWT_EXPIRATION="$JWT_EXPIRATION",NODE_ENV="production" \
  --memory 1Gi \
  --cpu 1 \
  --timeout 1800s \
  --project $PROJECT_ID
```

#### Step 4: Verify deployment

After deployment, note the URL provided by Google Cloud Run. This will be your backend API URL. Update your Vercel environment variables if needed.

## Configuring Playwright for Production

Ensure your scraper code launches Playwright with the correct options:

```javascript
// In your scraper code where you launch the browser
const browser = await playwright.chromium.launch({
  headless: true, // Always use headless in production
  args: [
    '--disable-dev-shm-usage',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-gpu'
  ]
});
```

## Fixing Common Issues

### Socket.IO Connection Issues

Ensure your backend URL is correctly set in the frontend environment variables. The Socket.IO connection will use this URL.

Check the CORS configuration in your backend to allow connections from your Vercel domain:

```javascript
// In your backend server.js or app.js
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://your-vercel-domain.vercel.app', '*']
    : ['http://localhost:8080'],
  // other options...
};
```

### Google Cloud Run Memory Issues

If your scrapers are failing due to memory issues:

1. Increase the memory allocation in Cloud Run (already set to 1Gi in the command above)
2. Consider using `--cpu 2` for more CPU resources
3. Monitor memory usage during scraping operations

### Debugging Deployment Issues

To check logs from your Cloud Run deployment:

```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=samscraper-backend" --limit=50
```

To check if Playwright is properly installed in your container:

```bash
# Get the container ID
CONTAINER_ID=$(docker ps -q -f ancestor=gcr.io/samscraper-460319/samscraper-backend:latest)

# Run a command inside the container
docker exec $CONTAINER_ID npx playwright --version
```

## Working with Scrapers in Production

When running scrapers in production:

1. Set longer timeouts for complex scraping operations
2. Consider implementing a job queue system for multiple concurrent scrapers
3. Implement proper error handling and retry mechanisms
4. Log scraping progress for debugging

## Scaling Considerations

For handling multiple concurrent scrapers:

1. Increase the memory and CPU allocation in Cloud Run
2. Consider implementing a job queue system
3. Monitor memory usage during scraping operations 