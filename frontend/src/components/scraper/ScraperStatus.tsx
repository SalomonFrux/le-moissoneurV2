import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

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

interface ScraperStatusProps {
  status: ScraperStatus;
  onRetry?: () => void;
}

export function ScraperStatusDisplay({ status, onRetry }: ScraperStatusProps) {
  const getProgressValue = () => {
    if (status.status === 'completed') return 100;
    if (status.status === 'error') return 0;
    if (status.status === 'initializing') return 5;
    return Math.min((status.currentPage / 50) * 100, 95); // Max 50 pages as per your scraper limit
  };

  const getStatusIcon = (type: 'info' | 'success' | 'warning' | 'error') => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    }
  };

  return (
    <Card className="p-4 w-full max-w-2xl mx-auto">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Scraper Status: {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
          </h3>
          {status.status === 'error' && onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1 text-sm bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Retry
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={getProgressValue()} className="w-full" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress: {Math.round(getProgressValue())}%</span>
            <span>Items found: {status.totalItems}</span>
          </div>
        </div>

        {/* Status Messages */}
        <ScrollArea className="h-[200px] rounded-md border p-2">
          <div className="space-y-2">
            {status.messages.map((message) => (
              <div
                key={message.id}
                className="flex items-start gap-2 text-sm"
              >
                {getStatusIcon(message.type)}
                <span className="flex-1">{message.text}</span>
                <span className="text-xs text-muted-foreground">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Error Message */}
        {status.error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {status.error}
          </div>
        )}
      </div>
    </Card>
  );
} 