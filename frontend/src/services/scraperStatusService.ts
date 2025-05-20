import { io, Socket } from 'socket.io-client';
import { API_URL } from '../config';
import { ScraperStatus } from '@/components/scraper/types';
import { authService } from './authService';

type StatusCallback = (status: ScraperStatus) => void;

class ScraperStatusService {
  private socket: Socket | null = null;
  private statusCallbacks: Map<string, StatusCallback> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000;
  private isConnected = false;

  constructor() {
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
  }

  connect(scraperId: string, onStatusUpdate: StatusCallback) {
    console.log(`ScraperStatusService: Connecting to scraper ${scraperId}`);
    
    // Store the callback for this scraper ID
    this.statusCallbacks.set(scraperId, onStatusUpdate);
    
    // Check authentication
    const token = authService.getToken();
    if (!token) {
      console.error('No authentication token available');
      this.sendErrorStatus(scraperId, 'Authentication required. Please log in.');
      return;
    }

    try {
      // Only create a new socket connection if one doesn't exist
      if (!this.socket || !this.isConnected) {
        // Close existing connection if any
        this.disconnect();

        console.log(`ScraperStatusService: Creating new Socket.IO connection to ${API_URL}`);
        
        // Create new Socket.IO connection with proper configuration
        this.socket = io(API_URL, {
          withCredentials: true,
          transports: ['websocket', 'polling'],
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectTimeout,
          autoConnect: true,
          auth: {
            token: token
          }
        });

        this.socket.on('connect', () => {
          console.log('Socket.IO connection established');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.reconnectTimeout = 1000;

          // Join rooms for all active scrapers
          this.statusCallbacks.forEach((_, scraperId) => {
            console.log(`ScraperStatusService: Joining scraper room for ${scraperId}`);
            this.socket?.emit('join-scraper', scraperId);
          });
        });

        this.socket.on('scraper-status', (data) => {
          console.log('ScraperStatusService: Received scraper status update:', data);

          // Find the appropriate scraper ID from the room ID if available
          // Backend might not send the scraper ID directly in the message
          const scraperId = data.scraperId || this.findScraperIdFromRoom(data);
          
          if (scraperId && this.statusCallbacks.has(scraperId)) {
            try {
              // Handle both message formats
              // Backend sends either { messages: [...] } or { message: "..." }
              let messages;
              
              if (Array.isArray(data.messages)) {
                messages = data.messages.map((msg: any) => ({
                  ...msg,
                  timestamp: new Date(msg.timestamp)
                }));
              } else {
                // Create a message from the message field and type
                messages = [{
                  id: `msg-${Date.now()}`,
                  type: data.type || 'info' as const,
                  text: data.message || 'Status updated',
                  timestamp: new Date()
                }];
              }
              
              // Construct a valid status object
              const status: ScraperStatus = {
                status: data.status,
                currentPage: data.currentPage || 0,
                totalItems: data.totalItems || 0,
                messages
              };
              
              console.log(`ScraperStatusService: Sending status update to callback for ${scraperId}`);
              const callback = this.statusCallbacks.get(scraperId);
              if (callback) {
                callback(status);
              }
            } catch (error) {
              console.error('ScraperStatusService: Error processing status update:', error);
            }
          } else {
            console.warn(`ScraperStatusService: No callback found for scraper ${scraperId || 'unknown'}`);
            console.log('ScraperStatusService: Active callbacks:', Array.from(this.statusCallbacks.keys()));
          }
        });

        // Add error handling for scraper-error event
        this.socket.on('scraper-error', (error) => {
          console.error('Scraper error:', error);
          const scraperId = error.scraperId;
          if (scraperId && this.statusCallbacks.has(scraperId)) {
            const callback = this.statusCallbacks.get(scraperId);
            if (callback) {
              callback({
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
              });
            }
          }
        });

        this.socket.on('connect_error', (error) => {
          this.isConnected = false;
          console.error('Socket.IO connection error:', error);
          
          // Attempt to reconnect
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);
            setTimeout(() => {
              this.reconnectAttempts++;
              this.reconnectTimeout *= 2; // Exponential backoff
              // Re-establish connection
              this.socket?.connect();
            }, this.reconnectTimeout);
          } else {
            console.error('Socket.IO connection failed after maximum attempts');
            // Notify all callbacks about the connection failure
            this.statusCallbacks.forEach((callback, id) => {
              this.sendErrorStatus(id, 'Connection lost. Please try again.');
            });
          }
        });

        this.socket.on('disconnect', () => {
          this.isConnected = false;
          console.log('Socket.IO disconnected');
        });
      }
      
      // Join the scraper room (even if connection already exists)
      if (this.socket && this.isConnected) {
        console.log(`ScraperStatusService: Joining scraper room for ${scraperId}`);
        this.socket.emit('join-scraper', scraperId);
      }
      
    } catch (error) {
      console.error('Error creating Socket.IO connection:', error);
      this.sendErrorStatus(scraperId, error instanceof Error ? error.message : 'Unknown error');
    }
  }
  
  // Helper to find a scraper ID from room info in the message
  private findScraperIdFromRoom(data: any): string | null {
    // If we have a room property, extract scraper ID from it
    if (data.room && typeof data.room === 'string' && data.room.startsWith('scraper-')) {
      return data.room.replace('scraper-', '');
    }
    
    // If there's only one active scraper, assume it's for that one
    if (this.statusCallbacks.size === 1) {
      return Array.from(this.statusCallbacks.keys())[0];
    }
    
    return null;
  }
  
  // Helper to send error status to a callback
  private sendErrorStatus(scraperId: string, message: string) {
    const callback = this.statusCallbacks.get(scraperId);
    if (callback) {
      callback({
        status: 'error',
        currentPage: 0,
        totalItems: 0,
        messages: [{
          id: 'error-' + Date.now(),
          type: 'error',
          text: message,
          timestamp: new Date()
        }],
        error: message
      });
    }
  }

  disconnect(scraperId?: string) {
    if (scraperId) {
      // Remove just this scraper's callback
      if (this.socket && this.isConnected) {
        this.socket.emit('leave-scraper', scraperId);
      }
      this.statusCallbacks.delete(scraperId);
      console.log(`ScraperStatusService: Disconnected scraper ${scraperId}`);
    } else {
      // Disconnect all
      if (this.socket) {
        console.log('ScraperStatusService: Disconnecting all scrapers');
        this.statusCallbacks.forEach((_, id) => {
          this.socket?.emit('leave-scraper', id);
        });
        
        this.socket.disconnect();
        this.socket = null;
        this.isConnected = false;
      }
      this.statusCallbacks.clear();
    }
    
    this.reconnectAttempts = 0;
    this.reconnectTimeout = 1000;
  }
}

export const scraperStatusService = new ScraperStatusService();