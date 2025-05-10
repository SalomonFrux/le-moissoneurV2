require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const scraperRoutes = require('./routes/scraperRoutes');
const scrapedDataRoutes = require('./routes/scrapedDataRoutes');
const { logger } = require('./utils/logger');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/scrapers', scraperRoutes);
app.use('/api/scraped-data', scrapedDataRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
    },
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});