import React, { useState, useEffect } from 'react';
import { StatsCard } from './StatsCard';
import { ScraperCard } from './ScraperCard';
import { DataTable } from './DataTable';
import { Database, Globe, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';
import { dataService, type Scraper, type Company, type ScrapedEntry } from '@/services/dataService';

interface ScraperData {
  id: string;
  name: string;
  source: string;
  status: 'idle' | 'running' | 'error' | 'completed';
  lastRun?: string;
  dataCount: number;
  selectors: { main: string };
  frequency: 'daily' | 'weekly' | 'monthly' | 'manual';
  country: string;
}

export function Dashboard() {
  const [page, setPage] = useState(1);
  const [scrapers, setScrapers] = useState<Scraper[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrapedData, setScrapedData] = useState<Record<string, ScrapedEntry[]>>({});

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch scrapers
        const scrapersRes = await dataService.getAllScrapers();
        setScrapers(scrapersRes);

        // Fetch companies with their scraped data
        const companiesRes = await dataService.fetchCompanies();
        const companiesWithEntries = companiesRes.map((company: Company) => ({
          ...company,
          scraped_entries: company.scraped_entries || []
        }));
        setCompanies(companiesWithEntries);

        // Fetch scraped data for each scraper
        const scrapedDataMap: Record<string, ScrapedEntry[]> = {};
        for (const scraper of scrapersRes) {
          try {
            const data = await dataService.fetchScrapedData(scraper.id);
            scrapedDataMap[scraper.id] = data;
          } catch (error) {
            console.error(`Error fetching data for scraper ${scraper.id}:`, error);
          }
        }
        setScrapedData(scrapedDataMap);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleRunScraper = async (id: string) => {
    try {
      await dataService.runScraper(id);
      setScrapers((prev) =>
        prev.map((scraper) =>
          scraper.id === id ? { ...scraper, status: 'running' } : scraper
        )
      );
      toast.success(`Scraper démarré`, {
        description: "Collecte de données en cours..."
      });
    } catch (error) {
      toast.error('Erreur lors du démarrage du scraper');
    }
  };

  const handleStopScraper = (id: string) => {
    setScrapers((prev) =>
      prev.map((scraper) =>
        scraper.id === id ? { ...scraper, status: 'idle' } : scraper
      )
    );
    toast.info(`Scraper arrêté`, {
      description: "L'opération a été interrompue."
    });
  };

  const handleViewData = async (id: string) => {
    try {
      const data = await dataService.fetchScrapedData(id);
      toast.info("Affichage des données", {
        description: `${data.length} entrées trouvées`
      });
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    }
  };

  // Calculate statistics
  const uniqueCountries = new Set(companies.map(c => c.country)).size;
  const totalCompanies = companies.length;
  const enrichmentRate = scrapers.length > 0 
    ? ((Object.values(scrapedData).flat().length / scrapers.length) * 100).toFixed(2)
    : '0.00';

  // Map scrapers to ScraperData format
  const mappedScrapers: ScraperData[] = scrapers.map(scraper => ({
    id: scraper.id,
    name: scraper.name,
    source: scraper.source,
    status: scraper.status,
    lastRun: scraper.last_run || undefined,
    dataCount: scrapedData[scraper.id]?.length || 0,
    selectors: { main: scraper.selectors?.main || '' },
    frequency: scraper.frequency,
    country: scraper.country
  }));

  // Map companies to ScrapedEntry format for DataTable
  const mappedEntries: ScrapedEntry[] = companies.flatMap(company => 
    (company.scraped_entries || []).map(entry => ({
      ...entry,
      nom: entry.nom || company.name,
      secteur: entry.secteur || company.sector,
      pays: entry.pays || company.country
    }))
  );

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
              value={totalCompanies.toString()}
              icon={<Database className="h-4 w-4 text-muted-foreground" />}
              description="entreprises collectées"
            />
            <StatsCard
              title="Pays Couverts"
              value={uniqueCountries.toString()}
              icon={<Globe className="h-4 w-4 text-muted-foreground" />}
              description="pays différents"
            />
            <StatsCard
              title="Taux d'enrichissement"
              value={`${enrichmentRate}%`}
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
              description="données enrichies"
            />
            <StatsCard
              title="Sources de données"
              value={scrapers.length.toString()}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
              description="sources actives"
            />
          </div>

          <h3 className="text-xl font-semibold font-heading">Scrapers</h3>
          {scrapers.length === 0 ? (
            <p>No scrapers available.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {mappedScrapers.map((scraper) => (
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
              data={mappedEntries}
              loading={loading}
            />
          )}
        </>
      )}
    </div>
  );
}
