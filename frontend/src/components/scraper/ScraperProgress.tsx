import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScraperStatus } from './types';

interface ScraperProgressProps {
  status: ScraperStatus;
  scraperName: string;
  onRetry?: () => Promise<void>;
}

export function ScraperProgress({ status, scraperName, onRetry }: ScraperProgressProps) {
  // Defensive coding to prevent errors if status is incomplete
  if (!status || typeof status !== 'object') {
    console.error('Invalid status object:', status);
    return null;
  }
  
  const getProgressValue = () => {
    if (status.status === 'completed') return 100;
    if (status.status === 'error') return 100; // Show full bar for errors too
    if (!status.totalItems || status.totalItems <= 0) return 0;
    
    const calculated = Math.round((status.currentPage / status.totalItems) * 100);
    
    // Ensure progress is between 0-100
    return Math.max(0, Math.min(100, calculated));
  };

  const getProgressBarColor = () => {
    switch (status.status) {
      case 'running':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  const getStatusText = () => {
    // Safely check for messages
    if (!status.messages || !Array.isArray(status.messages) || status.messages.length === 0) {
      return status.status.charAt(0).toUpperCase() + status.status.slice(1);
    }
    
    const lastMessage = status.messages[0]; // Most recent message first
    if (lastMessage && lastMessage.text) {
      return lastMessage.text;
    }
    
    return status.status.charAt(0).toUpperCase() + status.status.slice(1);
  };

  // Windows 10-style compact progress bar
  return (
    <div className="bg-gray-50 rounded shadow-sm p-2">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-sm">{scraperName}</span>
          <span className={`px-1.5 py-0.5 rounded-sm text-xs ${
            status.status === 'running' ? 'bg-blue-100 text-blue-700' : 
            status.status === 'completed' ? 'bg-green-100 text-green-700' : 
            'bg-red-100 text-red-700'
          }`}>
            {status.status}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {status.currentPage} / {status.totalItems || '?'}
        </span>
      </div>
      
      {/* Windows 10-style progress bar */}
      <div className="h-1.5 w-full bg-gray-100 rounded overflow-hidden">
        <div 
          className={`h-full ${getProgressBarColor()} transition-all duration-300`} 
          style={{ width: `${getProgressValue()}%` }}
        />
      </div>
      
      <p className="mt-1 text-xs text-gray-600 truncate" title={getStatusText()}>
        {getStatusText()}
      </p>
      
      {status.status === 'error' && onRetry && (
        <button
          onClick={() => onRetry?.()}
          className="mt-1 px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Retry
        </button>
      )}
    </div>
  );
}