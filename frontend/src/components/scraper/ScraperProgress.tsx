import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { ScraperStatus } from './types';

interface ScraperProgressProps {
  status: ScraperStatus;
  scraperName: string;
  onRetry?: () => Promise<void>;
}

export function ScraperProgress({ status, scraperName }: ScraperProgressProps) {
  console.log('ScraperProgress rendered with props:', { status, scraperName });
  
  const getProgressValue = () => {
    if (status.status === 'completed') return 100;
    if (status.status === 'error') return 0;
    if (status.totalItems === 0) return 0;
    console.log('Calculating progress:', status.currentPage, status.totalItems);
    return Math.round((status.currentPage / status.totalItems) * 100);
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

  const getStatusText = () => {
    const lastMessage = status.messages[status.messages.length - 1];
    if (lastMessage) {
      return lastMessage.text;
    }
    return status.status.charAt(0).toUpperCase() + status.status.slice(1);
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="font-medium">{scraperName}</span>
            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor()} text-white`}>
              {status.status}
            </span>
          </div>
          <span className="text-sm text-gray-500">
            {status.currentPage} / {status.totalItems || '?'} items
          </span>
        </div>
        <Progress value={getProgressValue()} className="h-2" />
        <p className="mt-2 text-sm text-gray-600">{getStatusText()}</p>
        {status.status === 'error' && onRetry && (
          <button
            onClick={() => onRetry?.()}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        )}
      </CardContent>
    </Card>
  );
}