const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class ScraperStatusHandler {
  constructor() {
    this.io = null;
  }

  setIo(io) {
    this.io = io;
  }

  sendStatus(scraperId, status) {
    if (!this.io) {
      logger.error('Socket.IO not initialized');
      return;
    }

    try {
      const message = {
        ...status,
        messages: status.messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString()
        }))
      };

      this.io.to(`scraper-${scraperId}`).emit('scraper-status', message);
      logger.info(`Status update sent to scraper room ${scraperId}`);
    } catch (error) {
      logger.error(`Error sending status to scraper ${scraperId}:`, error);
    }
  }

  updateStatus(scraperId, update) {
    if (!scraperId) {
      logger.error('Attempted to update status without scraper ID');
      return;
    }

    logger.info(`Updating status for scraper ${scraperId}:`, update);
    
    const status = {
      status: update.status,
      currentPage: update.currentPage,
      totalItems: update.totalItems,
      messages: [{
        id: uuidv4(),
        type: update.type || 'info',
        text: update.message,
        timestamp: new Date()
      }]
    };

    if (update.error) {
      status.error = update.error;
    }

    this.sendStatus(scraperId, status);
  }
}

module.exports = new ScraperStatusHandler(); 