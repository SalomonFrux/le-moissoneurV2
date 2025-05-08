import React, { useState, useEffect } from 'react';
import { StatsCard } from './StatsCard';
import { ScraperCard } from './ScraperCard';
import { DataTable } from './DataTable';
import { Database, Globe, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';
import { fetchScrapers, fetchCompanies } from '../../../../src/services/dataService';

export function Dashboard() {
  const [page, setPage] = useState(1);
  const [scrapers, setScrapers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [scrapersRes, companiesRes] = await Promise.all([
          fetchScrapers(),
          fetchCompanies()
        ]);
        console.log('Scrapers:', scrapersRes); // Log scrapers data
        console.log('Companies:', companiesRes); // Log companies data
        setScrapers(scrapersRes);
        setCompanies(companiesRes);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleRunScraper = (id) => {
    setScrapers((prev) =>
      prev.map((scraper) =>
        scraper.id === id ? { ...scraper, status: 'running' } : scraper
      )
    );
    toast.success(`Scraper ${scrapers.find(s => s.id === id)?.name} démarré`, {
      description: "Collecte de données en cours..."
    });
  };

  const handleStopScraper = (id) => {
    setScrapers((prev) =>
      prev.map((scraper) =>
        scraper.id === id ? { ...scraper, status: 'idle' } : scraper
      )
    );
    toast.info(`Scraper ${scrapers.find(s => s.id === id)?.name} arrêté`, {
      description: "L'opération a été interrompue."
    });
  };

  const handleViewData = (id) => {
    toast.info("Affichage des données", {
      description: `Données de ${scrapers.find(s => s.id === id)?.name}`
    });
  };

  return (
    <div className="space-y-8 p-6">
      <h2 className="text-3xl font-bold font-heading tracking-tight">Tableau de bord</h2>
      {loading ? (
        <p>Loading data...</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Entreprises"
              value={companies.length.toString()}
              icon={<Database className="h-4 w-4 text-muted-foreground" />}
              description="depuis le mois dernier"
            />
            <StatsCard
              title="Pays Couverts"
              value={companies.reduce((acc, curr) => acc + (curr.country ? 1 : 0), 0).toString()}
              icon={<Globe className="h-4 w-4 text-muted-foreground" />}
              description="nouveaux pays ajoutés"
            />
            <StatsCard
              title="Taux d'enrichissement"
              value={`${scrapers.length > 0 ? ((companies.length / scrapers.length) * 100).toFixed(2) : '0.00'}%`}
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
          {scrapers.length === 0 ? (
            <p>No scrapers available.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {scrapers.map((scraper) => (
                <ScraperCard
                  key={scraper.id}
                  scraper={scraper}
                  onRunScraper={handleRunScraper}
                  onStopScraper={handleStopScraper}
                  onViewData={handleViewData}
                />
              ))}
            </div>
          )}
          <h3 className="text-xl font-semibold font-heading mt-8">Données collectées</h3>
          {companies.length === 0 ? (
            <p>No companies available.</p>
          ) : (
            <DataTable
              data={companies}
              total={25}
              page={page}
              setPage={setPage}
              loading={loading}
            />
          )}
        </>
      )}
    </div>
  );
}
