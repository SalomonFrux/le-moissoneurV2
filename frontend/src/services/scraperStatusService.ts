import { io, Socket } from 'socket.io-client';
import { API_URL } from '../config';
import { ScraperStatus } from '@/components/scraper/types';
import { authService } from './authService';

type StatusCallback = (status: ScraperStatus) => void;

class ScraperStatusService {
  private socket: Socket | null = null;
  private statusCallback: StatusCallback | null = null;
  private currentScraperId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000;

  constructor() {
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
  }

  connect(scraperId: string, onStatusUpdate: StatusCallback) {
    // Check authentication
    const token = authService.getToken();
    if (!token) {
      console.error('No authentication token available');
      if (onStatusUpdate) {
        onStatusUpdate({
          status: 'error',
          currentPage: 0,
          totalItems: 0,
          messages: [{
            id: 'auth-error',
            type: 'error',
            text: 'Authentication required. Please log in.',
            timestamp: new Date()
          }],
          error: 'Authentication required'
        });
      }
      return;
    }

    // Store the current scraper ID
    this.currentScraperId = scraperId;
    this.statusCallback = onStatusUpdate;

    try {
      // Close existing connection if any
      this.disconnect();

      // Create new Socket.IO connection with proper configuration
      this.socket = io(API_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectTimeout,
        autoConnect: true
      });

      this.socket.on('connect', () => {
        console.log('Socket.IO connection established');
        this.reconnectAttempts = 0;
        this.reconnectTimeout = 1000;

        // Join the scraper room
        this.socket?.emit('join-scraper', scraperId);
      });

      this.socket.on('scraper-status', (data) => {
        if (this.statusCallback) {
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
      });

      // Add error handling for scraper-error event
      this.socket.on('scraper-error', (error) => {
        console.error('Scraper error:', error);
        if (this.statusCallback) {
          this.statusCallback({
            status: 'error',
            currentPage: 0,
            totalItems: 0,
            messages: [{
              id: 'scraper-error',
              type: 'error',
              text: error.error || 'Unknown error with scraper' + 
                (error.availableIds ? ` (Available IDs: ${error.availableIds.join(', ')})` : ''),
              timestamp: new Date()
            }],
            error: error.error || 'Unknown error'
            // Removed availableIds property
          });
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        
        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);
          setTimeout(() => {
            this.reconnectAttempts++;
            this.reconnectTimeout *= 2; // Exponential backoff
            this.connect(scraperId, onStatusUpdate);
          }, this.reconnectTimeout);
        } else {
          console.error('Socket.IO connection failed after maximum attempts');
          if (this.statusCallback) {
            this.statusCallback({
              status: 'error',
              currentPage: 0,
              totalItems: 0,
              messages: [{
                id: 'connection-error',
                type: 'error',
                text: 'Connection lost. Please try again.',
                timestamp: new Date()
              }],
              error: 'Connection failed'
            });
          }
        }
      });

      this.socket.on('disconnect', () => {
        console.log('Socket.IO disconnected');
      });
    } catch (error) {
      console.error('Error creating Socket.IO connection:', error);
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
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  disconnect() {
    if (this.socket) {
      console.log('Disconnecting Socket.IO');
      if (this.currentScraperId) {
        this.socket.emit('leave-scraper', this.currentScraperId);
      }
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentScraperId = null;
    this.statusCallback = null;
    this.reconnectAttempts = 0;
    this.reconnectTimeout = 1000;
  }
}

export const scraperStatusService = new ScraperStatusService();