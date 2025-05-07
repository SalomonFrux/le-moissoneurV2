import React, { useState, useEffect } from 'react';
import { StatsCard } from './StatsCard';
import { ScraperCard } from './ScraperCard';
import { DataTable } from './DataTable';
import { Database, Globe, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';
import { fetchScrapers, deleteScrapedData } from '../../services/dataService';
import type { Scraper, ScrapedData } from '../../types';

export interface ScraperCardProps {
  scraper: any;
  onStopScraper: (id: string) => void;
  onViewData: (id: string) => void;
  onRunScraper: (id: string) => void;
  onDelete: () => void;
}

export function Dashboard() {
  const [scrapers, setScrapers] = useState([]);
  const [scrapedData, setScrapedData] = useState([]);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [scrapersRes, dataRes] = await Promise.all([
          fetchScrapers(),
          setScrapedData()
        ]);
        setScrapers(scrapersRes);
        setScrapedData(dataRes);
      } catch (error) {
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleDeleteData = async (id: string) => {
    try {
      await deleteScrapedData(id);
      setScrapedData((prev) => prev.filter((item) => item.id !== id));
      toast.success('Donnée supprimée');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleRunScraper = (id: string) => {
    // Logic to run scraper
  };

  const handleStopScraper = (id: string) => {
    // Logic to stop scraper
  };

  const handleViewData = (id: string) => {
    // Logic to view data
  };

  return (
    <div className="space-y-8 p-6">
      <h2 className="text-3xl font-bold font-heading tracking-tight">Tableau de bord</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Entreprises"
          value={scrapedData.length.toString()}
          icon={<Database className="h-4 w-4 text-muted-foreground" />}
          description="depuis le mois dernier"
        />
        <StatsCard
          title="Pays Couverts"
          value={scrapedData.reduce((acc, curr) => acc + (curr.country ? 1 : 0), 0).toString()}
          icon={<Globe className="h-4 w-4 text-muted-foreground" />}
          description="nouveaux pays ajoutés"
        />
        <StatsCard
          title="Taux d'enrichissement"
          value={`${scrapers.length > 0 ? ((scrapedData.length / scrapers.length) * 100).toFixed(2) : '0.00'}%`}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          description="amélioration"
        />
        <StatsCard
          title="Sources de données"
          value={scrapers.length.toString()}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          description="sites monitorés"
        />
      </div>
      <h3 className="text-xl font-semibold font-heading">Scrapers</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {scrapers.map((scraper) => (
          <div key={scraper.id}>
            <ScraperCard
              scraper={scraper}
              onRunScraper={handleRunScraper}
              onStopScraper={handleStopScraper}
              onViewData={handleViewData}
              onDelete={() => {
                setScrapers((prev) => prev.filter((s) => s.id !== scraper.id));
                toast.success('Scraper supprimé');
              }}
            />
          </div>
        ))}
      </div>
      <h3 className="text-xl font-semibold font-heading mt-8">Données collectées</h3>
      <DataTable
        data={scrapedData}
        loading={loading}
        onDelete={handleDeleteData}
      />
    </div>
  );
}
