# Oracle Cloud Deployment Guide - Le Moissoneur v1

This guide documents the deployment process of Le Moissoneur v1 on Oracle Cloud Infrastructure (OCI).

## Infrastructure Specifications

- **VM Configuration:**
  - RAM: 8GB
  - CPU: 1 OCPU
  - OS: Ubuntu (Latest LTS)
  - IP: 140.238.211.241
  - Domain: api.sikso.ch

## Prerequisites

1. Oracle Cloud Account with access to VM instances
2. Domain name configured to point to the VM's IP
3. SSH access to the VM

## System Setup

### 1. Basic System Configuration

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y git curl wget build-essential
```

### 2. Node.js Installation

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 3. Browser Dependencies

```bash
# Install Chromium dependencies
sudo apt install -y ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 \
    libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 \
    libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 \
    libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
    libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 \
    libxss1 libxtst6 lsb-release xdg-utils

# Install Xvfb for headless browser support
sudo apt install -y xvfb
```

### 4. PM2 Installation

```bash
# Install PM2 globally
sudo npm install -y pm2 -g

# Enable PM2 startup script
sudo pm2 startup
```

### 5. Nginx Installation and Configuration

```bash
# Install Nginx
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

## Application Deployment

### 1. Clone and Setup

```bash
# Clone repository
git clone [your-repo-url]
cd le-moissoneur-v1

# Install dependencies
cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment Configuration

Create `.env` file in the backend directory:

```env
NODE_ENV=production
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
BROWSER_PATH=/usr/bin/chromium-browser
NODE_OPTIONS="--max-old-space-size=6144"
```

### 3. PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: "le-moissoneur",
    script: "./backend/dist/index.js",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    },
    node_args: "--max-old-space-size=7168"
  }]
}
```

### 4. Nginx Configuration

Create SSL certificate:
```bash
sudo certbot --nginx -d api.sikso.ch
```

Configure Nginx (`/etc/nginx/sites-available/le-moissoneur`):

```nginx
server {
    listen 443 ssl;
    server_name api.sikso.ch;

    ssl_certificate /etc/letsencrypt/live/api.sikso.ch/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.sikso.ch/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. Application Launch

```bash
# Build the application
cd backend && npm run build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
```

## Monitoring and Maintenance

### Health Checks

1. Verify application status:
```bash
pm2 status
pm2 logs
```

2. Monitor system resources:
```bash
htop
free -m
```

### Troubleshooting

Common issues and solutions:

1. **Browser Launch Timeout:**
   - Ensure Xvfb is running
   - Check memory usage
   - Verify browser dependencies

2. **Memory Issues:**
   - Monitor memory usage with `free -m`
   - Adjust Node.js memory limits in PM2 config
   - Check for memory leaks in PM2 logs

3. **WebSocket Connection Issues:**
   - Verify Nginx WebSocket configuration
   - Check firewall settings
   - Monitor connection logs

## Backup and Recovery

1. Database:
   - Supabase handles automatic backups
   - Regular monitoring of data integrity

2. Application:
   - Keep Git repository updated
   - Document any custom configurations
   - Maintain backup of environment variables

## Security Considerations

1. Firewall Configuration:
   - Only necessary ports open (80, 443)
   - Regular security updates
   - Monitor access logs

2. SSL/TLS:
   - Regular certificate renewal
   - Modern cipher configurations
   - Regular security audits

## Performance Optimization

1. Memory Allocation:
   - Node.js: 6GB
   - PM2: 7GB total
   - System reserve: 1GB

2. Browser Configuration:
   - Headless mode
   - Resource limitations
   - Connection pooling

## Maintenance Schedule

1. Regular Updates:
   - System packages: Weekly
   - Node.js dependencies: Monthly
   - SSL certificates: Every 90 days

2. Monitoring:
   - Daily log review
   - Weekly performance assessment
   - Monthly security audit 