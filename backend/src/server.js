const express = require('express');
const cors = require('cors');
const http = require('http');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const scraperStatusHandler = require('./websocket/scraperStatusHandler');
const routes = require('./routes');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);

// Configure CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://salomonks-moissonneur.vercel.app']
    : ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082', 'http://localhost:8083'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Regular HTTP middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api', routes);

// Initialize Socket.IO
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
// Update the Socket.IO connection handler
io.on('connection', (socket) => {
  logger.info(`New client connected: ${socket.id}`);

  socket.on('join-scraper', async (scraperId) => {
    logger.info(`Client ${socket.id} attempting to join scraper room: ${scraperId}`);
    
    // Validate scraper ID exists before joining room
    try {
      const { data, error } = await supabase
        .from('scrapers')
        .select('id, name, status')
        .eq('id', scraperId)
        .single();
      
      if (error || !data) {
        logger.error(`Invalid scraper ID ${scraperId}: ${error?.message || 'Not found'}`);
        
        // Try to find similar IDs for debugging
        const { data: similarScrapers } = await supabase
          .from('scrapers')
          .select('id, name')
          .limit(5);
          
        logger.info(`Available scrapers: ${JSON.stringify(similarScrapers?.map(s => s.id) || [])}`);
        
        // Send error to client
        socket.emit('scraper-error', {
          error: `Scraper with ID ${scraperId} not found`,
          availableIds: similarScrapers?.map(s => s.id) || []
        });
        return;
      }
      
      // Join the room if scraper exists
      socket.join(`scraper-${scraperId}`);
      logger.info(`Client ${socket.id} joined scraper room: ${scraperId}`);
      
      // Send initial status based on current scraper state
      scraperStatusHandler.sendStatus(scraperId, {
        status: data.status || 'initializing',
        currentPage: 0,
        totalItems: 0,
        messages: [{
          id: require('uuid').v4(),
          type: 'info',
          text: `Connected to scraper: ${data.name}`,
          timestamp: new Date()
        }]
      });
    } catch (err) {
      logger.error(`Error joining scraper room ${scraperId}: ${err.message}`);
      socket.emit('scraper-error', {
        error: `Error joining scraper room: ${err.message}`
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

// Update scraperStatusHandler to use Socket.IO
scraperStatusHandler.setIo(io);

// Error handling
app.use((err, req, res, next) => {
  logger.error('Server error:', err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  logger.info(`HTTP Server is running on port ${PORT}`);
  logger.info(`Socket.IO server is running on port ${PORT}`);
});