const express = require('express');
const cors = require('cors');
const scraperRoutes = require('./routes/scraperRoutes');
const scrapedDataRoutes = require('./routes/scrapedDataRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const exportRoutes = require('./routes/exportRoutes');
const authRoutes = require('./routes/authRoutes');
const { verifyToken } = require('./controllers/authController');

const app = express();

// Configure CORS
app.use(cors({
  origin: 'http://localhost:8080', // Your frontend URL
  credentials: true
}));

app.use(express.json());

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes - require authentication
app.use('/api/scrapers', verifyToken, scraperRoutes);
app.use('/api/scraped-data', verifyToken, scrapedDataRoutes);
app.use('/api/dashboard', verifyToken, dashboardRoutes);
app.use('/api/export', verifyToken, exportRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

module.exports = app;