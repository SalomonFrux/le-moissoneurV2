const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const { supabase } = require('../db/supabase');

// Ensure JWT_SECRET is available
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    logger.info('Login attempt:', { email });

    // Validate input
    if (!email || !password) {
      logger.warn('Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user in database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      logger.warn('User not found:', { email });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    logger.info('User found, comparing passwords');

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    logger.info('Password comparison result:', { isValid: isValidPassword });

    if (!isValidPassword) {
      logger.warn('Invalid password for user:', { email });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token with explicit expiration
    const token = jwt.sign(
      { 
        email: user.email,
        role: user.role,
        userId: user.id
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRATION || '24h',
        algorithm: 'HS256' // Explicitly specify the algorithm
      }
    );

    logger.info('Login successful:', { email });

    res.json({
      token,
      user: {
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided or invalid format' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256'] // Explicitly specify the allowed algorithms
      });
      req.user = decoded;
      next();
    } catch (err) {
      logger.error('Token verification failed:', err);
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token has expired' });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    logger.error('Token verification error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Helper function to generate a new hash (for testing)
const generateTestHash = async () => {
  const testPassword = 'extracteur2025@';
  const hash = await bcrypt.hash(testPassword, 10);
  logger.info('Test hash generated:', { hash });
  return hash;
};

module.exports = {
  login,
  verifyToken,
  generateTestHash
}; 