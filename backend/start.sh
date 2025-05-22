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

# Check system resources
echo "System resources:"
free -h
df -h
nproc

# Check browser availability
echo "Checking browser availability..."
check_command chromium || check_command chromium-browser || echo "No chromium found, will rely on configured paths"

# Set memory limits for Node.js if not already set
if [ -z "$NODE_OPTIONS" ]; then
  export NODE_OPTIONS="--max-old-space-size=6144"
  echo "Set Node.js memory limit to 6GB"
fi

# Start Xvfb with larger screen and more memory
echo "Starting Xvfb virtual display..."
Xvfb :99 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset > /dev/null 2>&1 &
export DISPLAY=:99

# Wait for Xvfb to start
echo "Waiting for Xvfb to start..."
for i in $(seq 1 10); do
  if xdpyinfo -display :99 >/dev/null 2>&1; then
    echo "Xvfb started successfully"
    break
  fi
  echo "Waiting... $i/10"
  sleep 1
done

# Verify Xvfb is running
if ! ps aux | grep -v grep | grep Xvfb > /dev/null; then
  echo "Warning: Xvfb may not have started correctly"
else
  echo "Xvfb is running"
fi

# Set up shared memory for Chrome
if [ ! -d /dev/shm ]; then
  mkdir /dev/shm
fi
mount -t tmpfs -o rw,nosuid,nodev,noexec,relatime,size=6144M tmpfs /dev/shm

echo "Starting Node.js application..."
exec node src/index.js 