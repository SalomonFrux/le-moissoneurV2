const http = require('http');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const logger = require('./utils/logger');
const app = require('./app');
const scraperStatusHandler = require('./websocket/scraperStatusHandler');

const server = http.createServer(app);

// Configure Socket.IO with the same CORS options as Express
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://salomonks-moissonneur.vercel.app']
    : ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082', 'http://localhost:8083'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Initialize Socket.IO with CORS settings
const io = new Server(server, {
  cors: corsOptions
});

// Socket.IO middleware for authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256']
    });
    socket.user = decoded;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  logger.info(`New client connected: ${socket.id}`);

  socket.on('join-scraper', async (scraperId) => {
    logger.info(`Client ${socket.id} attempting to join scraper room: ${scraperId}`);
    
    try {
      socket.join(`scraper-${scraperId}`);
      logger.info(`Client ${socket.id} joined scraper room: ${scraperId}`);
      
      // Send initial status
      scraperStatusHandler.sendStatus(scraperId, {
        status: 'initializing',
        currentPage: 0,
        totalItems: 0,
        messages: [{
          type: 'info',
          text: 'Initializing scraper...',
          timestamp: new Date()
        }]
      });
    } catch (error) {
      logger.error(`Error joining scraper room ${scraperId}: ${error.message}`);
      socket.emit('scraper-error', {
        error: `Error joining scraper room: ${error.message}`
      });
    }
  });

  socket.on('leave-scraper', (scraperId) => {
    logger.info(`Client left scraper room: ${scraperId}`);
    socket.leave(`scraper-${scraperId}`);
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected');
  });
});

// Initialize scraperStatusHandler with Socket.IO instance
logger.info('Initializing scraperStatusHandler with Socket.IO instance');
scraperStatusHandler.setIo(io);

// Error handling
app.use((err, req, res, next) => {
  logger.error('Server error:', err.stack);
  res.status(500).send('Something broke!');
});

// Export both server and io instances
module.exports = { server, io };