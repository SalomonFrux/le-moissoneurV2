const express = require('express');
const cors = require('cors');
const scraperRoutes = require('./routes/scraperRoutes');
const scrapedDataRoutes = require('./routes/scrapedDataRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const exportRoutes = require('./routes/exportRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/scrapers', scraperRoutes); // This will handle all routes prefixed with /api/scrapers
app.use('/api/scraped-data', scrapedDataRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/export', exportRoutes);

module.exports = app; 