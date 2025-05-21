# Deployment Guide for Le Moissoneur

This guide will help you deploy the application to Google Cloud Run.

## Prerequisites

- Google Cloud SDK installed and configured
- Docker installed (with linux/amd64 platform support for Apple Silicon)
- Access to the Supabase database

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

### 1. Build the Frontend

```bash
cd frontend
npm install
npm run build
```

This will create a `dist` directory with the compiled frontend assets.

### 2. Build and Deploy the Backend

```bash
cd backend

# Build the Docker image (for Apple Silicon machines)
docker build --platform linux/amd64 -t gcr.io/samscraper-460319/samscraper-backend:latest .

# Push the image to Google Container Registry
docker push gcr.io/samscraper-460319/samscraper-backend:latest

# Deploy to Google Cloud Run
PROJECT_ID=samscraper-460319
REGION=europe-west1
SUPABASE_URL="https://rbqkvzdzobxbnkjuprhx.supabase.co"
SUPABASE_KEY="your-supabase-service-key"
JWT_SECRET="your-jwt-secret"
JWT_EXPIRATION="24h"

gcloud run deploy samscraper-backend \
  --image gcr.io/$PROJECT_ID/samscraper-backend:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 4000 \
  --set-env-vars SUPABASE_URL="$SUPABASE_URL",SUPABASE_KEY="$SUPABASE_KEY",JWT_SECRET="$JWT_SECRET",JWT_EXPIRATION="$JWT_EXPIRATION" \
  --memory 512Mi \
  --cpu 1 \
  --project $PROJECT_ID
```

### 3. Deploy the Frontend to Firebase Hosting or Similar Service

You can use Firebase Hosting, Netlify, Vercel, or any other static hosting service.

```bash
# Example using Firebase
cd frontend
firebase init hosting
firebase deploy
```

## Fixing Common Issues

### Socket.IO Connection Issues

Ensure your backend URL is correctly set in the frontend environment variables. The Socket.IO connection will use this URL.

Check the CORS configuration in your backend to allow connections from your frontend domain:

```javascript
// In your backend server.js or app.js
const io = require('socket.io')(server, {
  cors: {
    origin: '*', // In production, set this to your frontend URL
    methods: ['GET', 'POST'],
    credentials: true
  }
});
```

### Progress Bar Issues

If the progress bar is not showing correctly:

1. Check the browser console for errors in the Socket.IO connection
2. Verify that the backend is sending status updates in the correct format
3. Ensure the frontend is correctly parsing and displaying the status updates

## Working with Scrapers

When deploying to production, ensure that:

1. Your backend has sufficient memory to run browser-based scrapers
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        2. The Docker container has all necessary dependencies for running Playwright/
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        3. Your GCR service has proper permissions to access external URLs

## Scaling Considerations

For handling multiple concurrent scrapers:

1. Increase the memory and CPU allocation in Cloud Run
2. Consider implementing a job queue system
3. Monitor memory usage during scraping operations 