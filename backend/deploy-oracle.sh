#!/bin/bash
set -e

# Configuration
REMOTE_USER="ubuntu"
REMOTE_HOST="140.238.211.241"
SSH_KEY="/Users/salomonks/Downloads/samscraperOraclePrivateKey/ssh-key-2025-05-21.key"
REMOTE_DIR="/home/ubuntu/backend"
PM2_APP_NAME="scraper-backend"

echo "Deploying to Oracle VM (api.sikso.ch)..."

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "Error: SSH key not found at $SSH_KEY"
    exit 1
fi

# Ensure SSH key has correct permissions
chmod 600 "$SSH_KEY"

# Create a temporary directory for the build
echo "Creating temporary build directory..."
BUILD_DIR=$(mktemp -d)
cp -r * "$BUILD_DIR/"

# Install dependencies and create production build
echo "Installing dependencies..."
(cd "$BUILD_DIR" && npm ci)

# Create tar archive of the build
echo "Creating deployment archive..."
tar -czf deploy.tar.gz -C "$BUILD_DIR" .

# Copy the archive to the server
echo "Copying files to server..."
scp -i "$SSH_KEY" deploy.tar.gz "$REMOTE_USER@$REMOTE_HOST:~/"

# Clean up local files
rm -rf "$BUILD_DIR" deploy.tar.gz

# Execute deployment commands on the remote server
echo "Deploying on remote server..."
ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" << 'ENDSSH'
    echo "Installing system dependencies..."
    # Update package list and install required packages
    sudo apt-get update
    sudo apt-get install -y \
        chromium-browser \
        xvfb \
        libgbm1 \
        libasound2 \
        libatk1.0-0 \
        libc6 \
        libcairo2 \
        libcups2 \
        libdbus-1-3 \
        libexpat1 \
        libfontconfig1 \
        libgcc1 \
        libgconf-2-4 \
        libgdk-pixbuf2.0-0 \
        libglib2.0-0 \
        libgtk-3-0 \
        libnspr4 \
        libpango-1.0-0 \
        libpangocairo-1.0-0 \
        libstdc++6 \
        libx11-6 \
        libx11-xcb1 \
        libxcb1 \
        libxcomposite1 \
        libxcursor1 \
        libxdamage1 \
        libxext6 \
        libxfixes3 \
        libxi6 \
        libxrandr2 \
        libxrender1 \
        libxss1 \
        libxtst6 \
        fonts-noto-color-emoji \
        fonts-freefont-ttf

    # Stop the existing PM2 process if it exists
    pm2 stop scraper-backend || true
    pm2 delete scraper-backend || true

    # Clean up old deployment
    rm -rf ~/backend-old
    [ -d ~/backend ] && mv ~/backend ~/backend-old

    # Create new deployment directory
    mkdir -p ~/backend

    # Extract new files
    tar -xzf ~/deploy.tar.gz -C ~/backend

    # Clean up archive
    rm ~/deploy.tar.gz

    # Install dependencies
    cd ~/backend
    npm ci

    # Ensure /dev/shm exists and has enough space
    sudo mount -t tmpfs -o rw,nosuid,nodev,noexec,relatime,size=6144M tmpfs /dev/shm || true

    # Create Xvfb startup script
    cat > ~/start-xvfb.sh << 'EOF'
#!/bin/bash
Xvfb :99 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset > /dev/null 2>&1 &
EOF
    chmod +x ~/start-xvfb.sh

    # Add Xvfb to PM2
    pm2 start ~/start-xvfb.sh --name xvfb || true
    
    # Set environment variables
    export DISPLAY=:99
    export NODE_ENV=production
    export NODE_OPTIONS="--max-old-space-size=6144"
    export PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser
    export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

    # Start the application with PM2
    cd ~/backend
    pm2 start src/index.js --name scraper-backend \
        --max-memory-restart 7G \
        --node-args="--max-old-space-size=6144" \
        --env NODE_ENV=production \
        --env DISPLAY=:99 \
        --env PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser \
        --env PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

    # Save PM2 configuration
    pm2 save

    # Show deployment status
    echo "Deployment completed successfully!"
    echo "System Status:"
    free -h
    df -h
    echo "PM2 Status:"
    pm2 status
    echo "Application Logs:"
    pm2 logs scraper-backend --lines 20
ENDSSH

echo "Deployment completed! You can monitor the application using:"
echo "ssh -i $SSH_KEY $REMOTE_USER@$REMOTE_HOST 'pm2 logs scraper-backend'"
echo "To check system status:"
echo "ssh -i $SSH_KEY $REMOTE_USER@$REMOTE_HOST 'free -h && df -h'" 