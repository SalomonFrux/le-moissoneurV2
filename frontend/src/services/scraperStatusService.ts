import { io, Socket } from 'socket.io-client';
import { API_URL } from '../config';
import { ScraperStatus } from '@/components/scraper/types';
import { authService } from './authService';

type StatusCallback = (status: ScraperStatus) => void;

class ScraperStatusService {
  private socket: Socket | null = null;
  private statusCallbacks: Map<string, StatusCallback> = new Map();
  private isConnected = false;

  constructor() {
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
  }

  connect(scraperId: string, onStatusUpdate: StatusCallback) {
    console.log(`[ScraperStatusService] connect() called for scraperId: ${scraperId}`);
    this.statusCallbacks.set(scraperId, onStatusUpdate);

    const token = authService.getToken();
    if (!token) {
      console.error('[ScraperStatusService] No auth token. Cannot connect socket.');
      this.sendErrorStatus(scraperId, 'Authentication required.');
      return;
    }

    if (!this.socket || !this.socket.connected) {
      console.log('[ScraperStatusService] No active socket or socket not connected. Creating new one.');
      // Disconnect any existing, potentially stale socket first
      if (this.socket) {
        this.socket.disconnect();
      }

      this.socket = io(API_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        autoConnect: true,
        auth: { token },
      });

      this.isConnected = false; // Will be set true on 'connect' event

      console.log('[ScraperStatusService] Attaching ONE-TIME core event handlers to new socket instance.');

      this.socket.once('connect', () => { // Use .once for initial setup if handlers are general
        console.log('[ScraperStatusService] Socket.IO core \'connect\' event fired. Socket ID:', this.socket?.id);
        this.isConnected = true;

        // When this new socket connects, iterate over ALL currently tracked callbacks
        // and ensure this socket joins each of their rooms.
        this.statusCallbacks.forEach((_, sId) => {
          console.log(`[ScraperStatusService] (Re)Joining room for scraperId: ${sId} on new connection.`);
          this.socket?.emit('join-scraper', sId);
        });
      });

      this.socket.on('disconnect', (reason) => {
        console.log(`[ScraperStatusService] Socket.IO disconnected. Reason: ${reason}`);
        this.isConnected = false;
        // Socket.IO will attempt to reconnect automatically based on its settings.
        // We might want to inform the UI that connection is temporarily lost.
        this.statusCallbacks.forEach((callback, sId) => {
            // Optionally send a 'disconnected' or 'reconnecting' status locally
            // callback({ status: 'reconnecting', messages: [{...}], ... }); 
        });
      });

      this.socket.on('connect_error', (error) => {
        console.error('[ScraperStatusService] Socket.IO connection error:', error);
        this.isConnected = false;
        // Error is logged. Socket.IO handles retry logic.
        // Notify all callbacks about the connection error after max retries, or immediately.
        this.statusCallbacks.forEach((callback, sId) => {
            this.sendErrorStatus(sId, `Connection error: ${error.message}`);
        });
      });

      // General handler for scraper-status - this should be .on to always listen
      this.socket.on('scraper-status', (data) => {
        console.log('[ScraperStatusService] Received raw \'scraper-status\' data:', JSON.stringify(data));
        
        const resolvedScraperId = data.scraperId; // Directly use scraperId from data

        console.log(`[ScraperStatusService] 'scraper-status' - Resolved scraperId: ${resolvedScraperId}`);
        if (resolvedScraperId && this.statusCallbacks.has(resolvedScraperId)) {
          const callback = this.statusCallbacks.get(resolvedScraperId)!;
          // Basic data transformation, assuming backend sends structured messages
          const statusUpdate: ScraperStatus = {
            status: data.status,
            currentPage: data.currentPage || 0,
            totalItems: data.totalItems || 0,
            messages: Array.isArray(data.messages) ? data.messages.map((msg: any) => ({ ...msg, timestamp: new Date(msg.timestamp) })) : [],
            error: data.error
          };
          if (!Array.isArray(data.messages) && data.message) { // Handle single message if backend sends that
            statusUpdate.messages.push({id: 'single-msg-'+Date.now(), type: data.type || 'info', text: data.message, timestamp: new Date()});
          }
          callback(statusUpdate);
        } else {
          console.warn(`[ScraperStatusService] No callback for scraperId '${resolvedScraperId}' or scraperId missing from status. Data:`, data);
        }
      });

      this.socket.on('scraper-error', (errorData) => {
        console.error('[ScraperStatusService] Received \'scraper-error\':', errorData);
        let scraperId = errorData.scraperId;
        if (!scraperId && this.statusCallbacks.size === 1) {
            scraperId = Array.from(this.statusCallbacks.keys())[0];
        }
        if (scraperId) {
            this.sendErrorStatus(scraperId, errorData.error || 'Unknown scraper error from server');
        } else {
            console.error('[ScraperStatusService] Received scraper-error without a resolvable scraperId.');
        }
      });

    } else if (this.socket && this.socket.connected) {
      // Socket exists and is already connected, just need to ensure this new scraperId joins its room.
      console.log(`[ScraperStatusService] Socket already connected. Emitting 'join-scraper' for new scraperId: ${scraperId}`);
      this.socket.emit('join-scraper', scraperId);
    } else {
        // Socket exists but is not connected (e.g. in a reconnecting state)
        // The 'connect' handler will eventually run and join rooms for all callbacks.
        console.log('[ScraperStatusService] Socket exists but is not currently connected. Room join will occur upon reconnection.');
    }
  }

  private sendErrorStatus(scraperId: string, errorMessage: string) {
    const callback = this.statusCallbacks.get(scraperId);
    if (callback) {
      callback({
        status: 'error',
        currentPage: 0,
        totalItems: 0,
        messages: [{ id: 'service-error-'+Date.now(), type: 'error', text: errorMessage, timestamp: new Date() }],
        error: errorMessage,
      });
    }
  }

  disconnect(scraperId?: string) {
    console.log(`[ScraperStatusService] disconnect() called. ScraperId: ${scraperId}`);
    if (scraperId) {
      if (this.socket && this.socket.connected) {
        console.log(`[ScraperStatusService] Emitting 'leave-scraper' for ${scraperId}`);
        this.socket.emit('leave-scraper', scraperId);
      }
      this.statusCallbacks.delete(scraperId);
      console.log(`[ScraperStatusService] Removed callback for ${scraperId}. Remaining callbacks: ${this.statusCallbacks.size}`);
      
      // If no more callbacks, disconnect the socket entirely.
      if (this.statusCallbacks.size === 0 && this.socket) {
        console.log('[ScraperStatusService] No more active scraper callbacks. Disconnecting main socket.');
        this.socket.disconnect();
        this.socket = null;
        this.isConnected = false;
      }
    } else { // Full disconnect
      if (this.socket) {
        console.log('[ScraperStatusService] Disconnecting main socket and all scraper callbacks.');
        this.socket.disconnect();
        this.socket = null;
        this.isConnected = false;
      }
      this.statusCallbacks.clear();
    }
  }
}

export const scraperStatusService = new ScraperStatusService();