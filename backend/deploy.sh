#!/bin/bash
set -e

# Configuration
PROJECT_ID=samscraper-460319
REGION=europe-west1
SERVICE_NAME=samscraper-backend
IMAGE_TAG=gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  echo "Loading environment variables from .env file"
  export $(grep -v '^#' .env | xargs)
fi

# Check for required environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ] || [ -z "$JWT_SECRET" ] || [ -z "$JWT_EXPIRATION" ]; then
  echo "Error: Missing required environment variables"
  echo "Please ensure SUPABASE_URL, SUPABASE_KEY, JWT_SECRET, and JWT_EXPIRATION are set"
  exit 1
fi

echo "Building and deploying $SERVICE_NAME to Google Cloud Run..."

# Build the Docker image for Apple Silicon
echo "Building Docker image for linux/amd64 platform..."
docker build --platform linux/amd64 -t $IMAGE_TAG .

# Push the image to Google Container Registry
echo "Pushing image to Google Container Registry..."
docker push $IMAGE_TAG

# Deploy to Google Cloud Run
echo "Deploying to Google Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_TAG \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 4000 \
  --set-env-vars SUPABASE_URL="$SUPABASE_URL",SUPABASE_KEY="$SUPABASE_KEY",JWT_SECRET="$JWT_SECRET",JWT_EXPIRATION="$JWT_EXPIRATION",NODE_ENV="production" \
  --memory 1Gi \
  --cpu 1 \
  --timeout 1800s \
  --project $PROJECT_ID

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --project $PROJECT_ID --format 'value(status.url)')

echo "Deployment completed successfully!"
echo "Service URL: $SERVICE_URL"
echo ""
echo "Remember to update your frontend environment variables with this URL."
echo "For Vercel, set VITE_API_URL=$SERVICE_URL" 