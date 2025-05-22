#!/bin/bash

echo "Starting scraper backend server..."

# Function to check if a command exists
check_command() {
  if command -v $1 >/dev/null 2>&1; then
    echo "✓ $1 is available"
    return 0
  else
    echo "✗ $1 is not available"
    return 1
  fi
}

# Check browser availability
echo "Checking browser availability..."
check_command chromium || check_command chromium-browser || echo "No chromium found, will rely on configured paths"

# Set memory limits for Node.js if not already set
if [ -z "$NODE_OPTIONS" ]; then
  export NODE_OPTIONS="--max-old-space-size=4096"
  echo "Set Node.js memory limit to 4GB"
fi

# Start Xvfb
echo "Starting Xvfb virtual display..."
Xvfb :99 -screen 0 1280x1024x24 > /dev/null 2>&1 &
export DISPLAY=:99

# Wait a bit for Xvfb to start
sleep 2

# Verify Xvfb is running
if ! ps aux | grep -v grep | grep Xvfb > /dev/null; then
  echo "Warning: Xvfb may not have started correctly"
fi

echo "Starting Node.js application..."
node src/index.js 