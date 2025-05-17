const express = require('express');
const { login, generateTestHash } = require('../controllers/authController');

const router = express.Router();

router.post('/login', login);

// Test route to generate a new hash (remove in production)
router.get('/test-hash', async (req, res) => {
  const hash = await generateTestHash();
  res.json({ hash });
});

module.exports = router; 