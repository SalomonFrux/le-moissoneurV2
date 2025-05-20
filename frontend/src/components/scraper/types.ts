export interface ScraperStatus {
  status: 'initializing' | 'running' | 'completed' | 'error';
  currentPage: number;
  totalItems: number;
  messages: Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    text: string;
    timestamp: Date;
  }>;
  error?: string;
} 