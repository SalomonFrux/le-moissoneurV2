import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { ScraperStatus } from './types';

interface ScraperProgressProps {
  status: ScraperStatus;
  scraperName: string;
  onRetry?: () => Promise<void>;
}

export function ScraperProgress({ status, scraperName, onRetry }: ScraperProgressProps) {
  console.log('ScraperProgress rendered with props:', { status, scraperName });
  
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
    console.log('Calculating progress:', status.currentPage, status.totalItems, calculated);
    
    // Ensure progress is between 0-100
    return Math.max(0, Math.min(100, calculated));
  };

  const getStatusColor = () => {
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

  return (
    <Card className="mb-4 border-l-4 border-l-blue-500 shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-lg">{scraperName}</span>
            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor()} text-white`}>
              {status.status}
            </span>
          </div>
          <span className="text-sm font-medium bg-gray-100 px-2 py-1 rounded">
            Page {status.currentPage} / {status.totalItems || '?'} items
          </span>
        </div>
        
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mt-2">
          <div 
            className={`h-full ${getProgressBarColor()} transition-all duration-500 ease-in-out`} 
            style={{ width: `${getProgressValue()}%` }}
          />
        </div>
        
        <p className="mt-3 text-sm text-gray-700">
          {getStatusText()}
        </p>
        
        {status.messages && status.messages.length > 1 && (
          <details className="mt-2">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
              Show message history ({status.messages.length} messages)
            </summary>
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs max-h-40 overflow-y-auto">
              {status.messages.map((msg, i) => (
                <div 
                  key={msg.id || i} 
                  className={`mb-1 p-1 rounded ${
                    msg.type === 'error' ? 'bg-red-100 text-red-800' : 
                    msg.type === 'success' ? 'bg-green-100 text-green-800' : 
                    msg.type === 'warning' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-blue-50 text-blue-800'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>
          </details>
        )}
        
        {status.status === 'error' && onRetry && (
          <button
            onClick={() => onRetry?.()}
            className="mt-3 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-sm rounded flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry
          </button>
        )}
      </CardContent>
    </Card>
  );
}