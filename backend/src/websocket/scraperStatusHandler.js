const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class ScraperStatusHandler {
  constructor() {
    this.connections = new Map();
  }

  handleConnection(ws, scraperId) {
    logger.info(`Handling new WebSocket connection for scraper ${scraperId}`);

    // Store the connection
    if (!this.connections.has(scraperId)) {
      this.connections.set(scraperId, new Set());
    }
    this.connections.get(scraperId).add(ws);

    // Send immediate confirmation
    this.sendToClient(ws, {
      status: 'connected',
      scraperId,
      timestamp: new Date().toISOString()
    });

    // Send initial status
    this.sendStatus(scraperId, {
      status: 'initializing',
      currentPage: 0,
      totalItems: 0,
      messages: [{
        id: uuidv4(),
        type: 'info',
        text: 'Initializing scraper...',
        timestamp: new Date()
      }]
    });

    // Setup connection handlers
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        logger.info(`Received message from scraper ${scraperId}:`, data);
      } catch (error) {
        logger.error(`Error parsing message from scraper ${scraperId}:`, error);
      }
    });

    ws.on('close', () => {
      logger.info(`WebSocket connection closed for scraper ${scraperId}`);
      const connections = this.connections.get(scraperId);
      if (connections) {
        connections.delete(ws);
        if (connections.size === 0) {
          this.connections.delete(scraperId);
        }
      }
    });

    ws.on('error', (error) => {
      logger.error(`WebSocket error for scraper ${scraperId}:`, error);
    });

    // Setup ping/pong
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Start ping interval for this connection
    const pingInterval = setInterval(() => {
      if (ws.isAlive === false) {
        logger.warn(`Terminating inactive connection for scraper ${scraperId}`);
        clearInterval(pingInterval);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    }, 30000);

    // Clear interval when connection closes
    ws.on('close', () => clearInterval(pingInterval));
  }

  sendToClient(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(data));
      } catch (error) {
        logger.error('Error sending message to client:', error);
      }
    }
  }

  sendStatus(scraperId, status) {
    const connections = this.connections.get(scraperId);
    if (!connections) {
      logger.warn(`No active connections for scraper ${scraperId}`);
      return;
    }

    const message = JSON.stringify({
      ...status,
      messages: status.messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      }))
    });

    let successCount = 0;
    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
          successCount++;
        } catch (error) {
          logger.error(`Error sending status to client for scraper ${scraperId}:`, error);
        }
      }
    });

    logger.info(`Status update sent to ${successCount}/${connections.size} connections for scraper ${scraperId}`);
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