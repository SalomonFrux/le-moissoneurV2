const { server, io } = require('./server');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 4000;

// Global error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Server error handling
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  switch (error.code) {
    case 'EACCES':
      logger.error(`Port ${PORT} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`Port ${PORT} is already in use`);
      logger.error('Try these steps to resolve:');
      logger.error('1. Find the process using the port:');
      logger.error(`   - On macOS/Linux: lsof -i :${PORT}`);
      logger.error(`   - On Windows: netstat -ano | findstr :${PORT}`);
      logger.error('2. Or use a different port by setting the PORT environment variable');
      process.exit(1);
      break;
    default:
      throw error;
  }
});

// Start the server
server.listen(PORT, () => {
  logger.info(`HTTP Server is running on port ${PORT}`);
  logger.info(`Socket.IO server is running on port ${PORT}`);
});