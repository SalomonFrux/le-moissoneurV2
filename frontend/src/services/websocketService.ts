import { API_URL } from '@/config';
import { ScraperStatus } from '@/components/scraper/ScraperStatus';

type StatusCallback = (status: ScraperStatus) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000; // Start with 1 second
  private statusCallback: StatusCallback | null = null;
  private currentScraperId: string | null = null;
  private isConnecting: boolean = false;

  constructor() {
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
  }

  connect(scraperId: string, onStatusUpdate: StatusCallback) {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      console.log('Connection attempt already in progress');
      return;
    }

    // Store the current scraper ID
    this.currentScraperId = scraperId;
    this.isConnecting = true;
    
    // Convert HTTP/HTTPS to WS/WSS
    const wsUrl = API_URL.replace(/^http/, 'ws');
    const fullUrl = `${wsUrl}/ws/scraper/${scraperId}`;
    console.log('Connecting to WebSocket URL:', fullUrl);
    
    try {
      if (this.ws) {
        console.log('Closing existing WebSocket connection');
        this.ws.close(1000, 'Switching scrapers');
        this.ws = null;
      }

      this.ws = new WebSocket(fullUrl);
      this.statusCallback = onStatusUpdate;

      this.ws.onopen = () => {
        console.log('WebSocket connection established');
        this.reconnectAttempts = 0;
        this.reconnectTimeout = 1000;
        this.isConnecting = false;
        
        // Send initial message to confirm connection
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'init',
            scraperId
          }));
        }
      };

      this.ws.onmessage = (event) => {
        try {
          console.log('Received WebSocket message:', event.data);
          const data = JSON.parse(event.data);
          
          // Handle connection confirmation
          if (data.status === 'connected') {
            console.log('Connection confirmed by server');
            return;
          }
          
          if (this.statusCallback && data.status) {
            // Convert timestamp strings to Date objects
            const status: ScraperStatus = {
              ...data,
              messages: Array.isArray(data.messages) ? data.messages.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
              })) : []
            };
            this.statusCallback(status);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        this.isConnecting = false;
        console.log('WebSocket connection closed', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });

        // Don't reconnect if we're closing intentionally or switching scrapers
        if (this.currentScraperId !== scraperId) {
          console.log('Not reconnecting - scraper ID changed');
          return;
        }

        if (this.reconnectAttempts < this.maxReconnectAttempts && event.code !== 1000) {
          console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);
          setTimeout(() => {
            this.reconnectAttempts++;
            this.reconnectTimeout *= 2; // Exponential backoff
            this.connect(scraperId, onStatusUpdate);
          }, this.reconnectTimeout);
        } else {
          console.error('WebSocket connection failed after maximum attempts');
          if (this.statusCallback) {
            this.statusCallback({
              status: 'error',
              currentPage: 0,
              totalItems: 0,
              messages: [{
                id: 'connection-error',
                type: 'error',
                text: event.code === 1000 ? 'Connection closed normally' : 'Connection lost. Please try again.',
                timestamp: new Date()
              }],
              error: `Connection closed (${event.code})`
            });
          }
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.isConnecting = false;
      if (this.statusCallback) {
        this.statusCallback({
          status: 'error',
          currentPage: 0,
          totalItems: 0,
          messages: [{
            id: 'connection-error',
            type: 'error',
            text: 'Failed to establish connection. Please try again.',
            timestamp: new Date()
          }],
          error: error.message
        });
      }
    }
  }

  disconnect() {
    this.currentScraperId = null;
    this.isConnecting = false;
    if (this.ws) {
      console.log('Disconnecting WebSocket');
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }
    this.statusCallback = null;
    this.reconnectAttempts = 0;
    this.reconnectTimeout = 1000;
  }
}

export const websocketService = new WebSocketService(); 