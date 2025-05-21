import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScraperStatus } from './types';
import { X } from 'lucide-react';

interface ScraperProgressProps {
  status: ScraperStatus;
  scraperName: string;
  onRetry?: () => Promise<void>;
  onDismiss?: () => void;
}

export function ScraperProgress({ status, scraperName, onRetry, onDismiss }: ScraperProgressProps) {
  // State to track animation progress for running state
  const [animationProgress, setAnimationProgress] = useState(15);
  
  // Effect to animate the progress bar while running
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (status.status === 'running' || status.status === 'initializing') {
      interval = setInterval(() => {
        setAnimationProgress(prev => {
          // Move between 15% and 85% in a loop
          if (prev >= 85) return 15;
          return prev + 1;
        });
      }, 100);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status.status]);
  
  // Defensive coding to prevent errors if status is incomplete
  if (!status || typeof status !== 'object') {
    console.error('Invalid status object:', status);
    return null;
  }
  
  // Translate status messages to French
  const translateStatus = (statusText: string) => {
    const translations: Record<string, string> = {
      'initializing': 'initialisation',
      'running': 'en cours',
      'completed': 'terminé',
      'error': 'erreur'
    };
    
    return translations[statusText] || statusText;
  };
  
  const getProgressBarColor = () => {
    switch (status.status) {
      case 'running':
        return 'bg-green-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-green-500';
    }
  };
  
  const getProgressValue = () => {
    if (status.status === 'completed') return 100; 
    if (status.status === 'error') return 100;
    if (status.status === 'running' || status.status === 'initializing') {
      return animationProgress; // Use our animated progress
    }
    return 0;
  };
  
  const getStatusText = () => {
    // Safely check for messages
    if (!status.messages || !Array.isArray(status.messages) || status.messages.length === 0) {
      return translateStatus(status.status);
    }
    
    const lastMessage = status.messages[0]; // Most recent message first
    if (lastMessage && lastMessage.text) {
      return lastMessage.text;
    }
    
    return translateStatus(status.status);
  };

  return (
    <div className="bg-gray-50 rounded shadow-sm p-2">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-sm">{scraperName}</span>
          <span className={`px-1.5 py-0.5 rounded-sm text-xs ${
            status.status === 'running' ? 'bg-green-100 text-green-700' : 
            status.status === 'completed' ? 'bg-green-100 text-green-700' : 
            'bg-red-100 text-red-700'
          }`}>
            {translateStatus(status.status)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {status.currentPage} / {status.totalItems || '?'}
          </span>
          {onDismiss && (
            <button 
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Animated progress bar */}
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
          Réessayer
        </button>
      )}
    </div>
  );
}