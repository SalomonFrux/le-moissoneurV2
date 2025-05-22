FROM node:18-slim

# Install Chromium dependencies
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
    fonts-freefont-ttf \
    dbus \
    xvfb \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libxtst6 \
    libasound2 \
    libatspi2.0-0 \
    wget \
    gnupg \
    ca-certificates

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the code
COPY . .

# Verify Chromium installation and path
RUN which chromium || which chromium-browser || echo "Chromium not found in path"

# Set environment variables for Playwright and Puppeteer
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV DISPLAY=:99
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Make the startup script executable
RUN chmod +x start.sh

# Expose the port the app runs on
EXPOSE 4000

# Start the app using our startup script
CMD ["./start.sh"]