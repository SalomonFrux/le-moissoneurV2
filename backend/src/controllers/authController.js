const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const { supabase } = require('../db/supabase');

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

    // Generate JWT token
    const token = jwt.sign(
      { 
        email: user.email,
        role: user.role,
        userId: user.id
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
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
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
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