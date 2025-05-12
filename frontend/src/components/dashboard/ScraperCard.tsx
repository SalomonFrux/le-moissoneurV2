import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCw, Database, Square, Eye, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  type: 'playwright' | 'puppeteer';
}

interface ScraperCardProps {
  scraper: ScraperData;
  onRunScraper: (id: string) => void;
  onStopScraper: (id: string) => void;
  onViewData: (id: string) => void;
  onEditScraper: (scraper: ScraperData) => void;
  onDeleteScraper: (id: string) => void;
}

export function ScraperCard({ scraper, onRunScraper, onStopScraper, onViewData, onEditScraper, onDeleteScraper }: ScraperCardProps) {
  const getStatusColor = (status: ScraperData['status']) => {
    switch (status) {
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

  const getStatusText = (status: ScraperData['status']) => {
    switch (status) {
      case 'running':
        return 'En cours';
      case 'completed':
        return 'Terminé';
      case 'error':
        return 'Erreur';
      default:
        return 'Inactif';
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-base font-medium">{scraper.name}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEditScraper(scraper)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action ne peut pas être annulée. Ce scraper sera définitivement supprimé.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => onDeleteScraper(scraper.id)}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
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
              <Square className="h-4 w-4 mr-2" />
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
            <Eye className="h-4 w-4 mr-2" />
            Données
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(scraper.status)}`} />
          <span className="text-xs text-muted-foreground">
            {getStatusText(scraper.status)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {scraper.status === 'running' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStopScraper(scraper.id)}
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRunScraper(scraper.id)}
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewData(scraper.id)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
