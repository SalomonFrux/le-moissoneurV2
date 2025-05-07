
import React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '../../../africa-venture-harvest/src/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../africa-venture-harvest/src/components/ui/card';
import { Badge } from '../../../africa-venture-harvest/src/components/ui/badge';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../africa-venture-harvest/src/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../africa-venture-harvest/src/components/ui/dropdown-menu';
import { useToast } from '../../../africa-venture-harvest/src/hooks/use-toast';
import { Scraper, updateScraper } from '../../services/scraperService';
import { CalendarIcon, Clock, MoreVertical, Play, Trash } from 'lucide-react';

// Backend API base URL - you can use environment variables in a real app
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

interface ScraperCardProps {
  scraper: Scraper;
  onDelete: () => void;
  onRunScraper: (id: string) => void;
  onStopScraper: (id: string) => void;
  onViewData: (id: string) => void;
}

export function ScraperCard({ scraper, onDelete }: ScraperCardProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [statusCheckerInterval, setStatusCheckerInterval] = useState<number | null>(null);
  const { toast } = useToast();

  // Clean up interval when component unmounts
  useEffect(() => {
    return () => {
      if (statusCheckerInterval) {
        clearInterval(statusCheckerInterval);
      }
    };
  }, [statusCheckerInterval]);

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'running':
        return 'bg-blue-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const checkScraperStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/scrapers/status/${scraper.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to get scraper status');
      }
      
      const data = await response.json();
      
      // If status has changed, update the state
      if (data.scraper.status !== 'running') {
        // Clear interval once scraper is no longer running
        if (statusCheckerInterval) {
          clearInterval(statusCheckerInterval);
          setStatusCheckerInterval(null);
        }
        
        // Update scraper in UI or trigger a refresh
        if (data.scraper.status === 'active') {
          toast({
            title: 'Success',
            description: 'Scraper finished successfully',
          });
        } else if (data.scraper.status === 'error') {
          toast({
            title: 'Error',
            description: 'Scraper encountered an error',
            variant: 'destructive',
          });
        }
        
        // Force update scraper
        await updateScraper(scraper.id, { 
          status: data.scraper.status,
          last_run: data.scraper.last_run
        });
        
        setIsRunning(false);
      }
    } catch (error) {
      console.error('Error checking scraper status:', error);
    }
  };

  const handleRunScraper = async () => {
    setIsRunning(true);
    
    try {
      // Call backend API to start the scraper
      const response = await fetch(`${API_BASE_URL}/scrapers/run/${scraper.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to run scraper');
      }
      
      // Update local state to show running status
      await updateScraper(scraper.id, { status: 'running' });
      
      toast({
        title: 'Scraper Started',
        description: 'The scraper has been started and is collecting data',
      });
      
      // Start polling for status updates every 5 seconds
      const interval = window.setInterval(() => {
        checkScraperStatus();
      }, 5000);
      
      setStatusCheckerInterval(interval);
      
    } catch (error) {
      console.error('Failed to run scraper:', error);
      setIsRunning(false);
      
      toast({
        title: 'Error',
        description: 'Failed to start the scraper',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{scraper.name}</CardTitle>
            <CardDescription className="mt-1">
              {scraper.description || 'No description'}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setConfirmDelete(true)}>
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-3">
          <Badge className={getStatusColor(scraper.status)}>
            {scraper.status || 'inactive'}
          </Badge>
        </div>
        
        {scraper.url && (
          <div className="text-sm text-muted-foreground mb-3 truncate">
            Target: {scraper.url}
          </div>
        )}
        
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="mr-1 h-4 w-4" />
          <span>Last run: {formatDate(scraper.last_run)}</span>
        </div>
        
        <div className="flex items-center text-sm text-muted-foreground mt-1">
          <CalendarIcon className="mr-1 h-4 w-4" />
          <span>Created: {formatDate(scraper.created_at)}</span>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button
          className="w-full"
          onClick={handleRunScraper}
          disabled={isRunning || scraper.status === 'running'}
        >
          {isRunning || scraper.status === 'running' ? (
            <>Running...</>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" /> Run Scraper
            </>
          )}
        </Button>
      </CardFooter>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This will permanently delete the scraper "{scraper.name}" and all its data.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete();
                setConfirmDelete(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}