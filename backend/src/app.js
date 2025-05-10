const express = require('express');
const cors = require('cors');
const scraperRoutes = require('./routes/scraperRoutes');
const scrapedDataRoutes = require('./routes/scrapedDataRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/scrapers', scraperRoutes);
app.use('/api/scraped-data', scrapedDataRoutes);

module.exports = app; 