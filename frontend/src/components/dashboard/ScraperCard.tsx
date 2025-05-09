import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCw, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ScraperData {
  id: string;
  name: string;
  source: string;
  status: 'idle' | 'running' | 'error' | 'completed';
  lastRun?: string;
  dataCount: number;
  selectors?: { main: string };
  frequency: 'daily' | 'weekly' | 'monthly' | 'manual';
  country: string;
}

interface ScraperCardProps {
  scraper: ScraperData;
  onRunScraper: (id: string) => void;
  onStopScraper: (id: string) => void;
  onViewData: (id: string) => void;
}

export function ScraperCard({ scraper, onRunScraper, onStopScraper, onViewData }: ScraperCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-base font-medium">{scraper.name}</CardTitle>
        <Badge
          className={cn(
            scraper.status === 'running' && "bg-africa-green-400 hover:bg-africa-green-400",
            scraper.status === 'error' && "bg-red-500 hover:bg-red-500",
            scraper.status === 'completed' && "bg-africa-earth-400 hover:bg-africa-earth-400",
            scraper.status === 'idle' && "bg-slate-500 hover:bg-slate-500",
          )}
        >
          {scraper.status === 'running' && "En cours"}
          {scraper.status === 'error' && "Erreur"}
          {scraper.status === 'completed' && "Terminé"}
          {scraper.status === 'idle' && "Inactif"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground mb-4">
          Source: <span className="font-medium">{scraper.source}</span>
          {scraper.lastRun && (
            <div className="text-xs mt-1">
              Dernière exécution: {scraper.lastRun}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between text-sm mb-3">
          <div className="flex items-center gap-1">
            <Database className="h-4 w-4 text-africa-green-500" />
            <span>{scraper.dataCount} entrées</span>
          </div>
        </div>
        
        <div className="flex gap-2 mt-2">
          {scraper.status === 'running' ? (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onStopScraper(scraper.id)}
            >
              <Pause className="h-4 w-4 mr-2" />
              Arrêter
            </Button>
          ) : (
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1 bg-africa-green-500 hover:bg-africa-green-600"
              onClick={() => onRunScraper(scraper.id)}
            >
              <Play className="h-4 w-4 mr-2" />
              Exécuter
            </Button>
          )}
          <Button 
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewData(scraper.id)}
          >
            <Database className="h-4 w-4 mr-2" />
            Données
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
