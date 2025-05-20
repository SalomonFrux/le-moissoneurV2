const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const scraperStatusHandler = require('./websocket/scraperStatusHandler');
const routes = require('./routes');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Handle WebSocket connections
wss.on('connection', (ws, request, scraperId) => {
  logger.info(`WebSocket connection established for scraper ${scraperId}`);
  scraperStatusHandler.handleConnection(ws, scraperId);
});

// Handle upgrade requests BEFORE any middleware
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
  const match = pathname.match(/^\/ws\/scraper\/([^/]+)$/);

  if (!match) {
    logger.warn(`Invalid WebSocket path: ${pathname}`);
    socket.destroy();
    return;
  }

  const scraperId = match[1];
  logger.info(`WebSocket upgrade request for scraper ${scraperId}`);

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request, scraperId);
  });
});

// Configure CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://salomonks-moissonneur.vercel.app']
    : ['http://localhost:3000', 'http://localhost:8080'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Regular HTTP middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api', routes);

// Error handling
app.use((err, req, res, next) => {
  logger.error('Server error:', err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  logger.info(`HTTP Server is running on port ${PORT}`);
  logger.info(`WebSocket Server is available at ws://localhost:${PORT}/ws/scraper`);
}); 