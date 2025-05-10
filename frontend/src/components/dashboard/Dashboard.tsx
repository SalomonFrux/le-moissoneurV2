import React, { useState, useEffect } from 'react';
import { StatsCard } from './StatsCard';
import { ScraperCard } from './ScraperCard';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database, Globe, TrendingUp, Users, ChevronDown, ChevronRight, Download, Mail, Link as LinkIcon } from 'lucide-react';
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
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [groupedData, setGroupedData] = useState<Record<string, ScrapedEntry[]>>({});

  const calculateStats = (data: Record<string, ScrapedEntry[]>) => {
    const allEntries = Object.values(data).flat();
    const totalEntries = allEntries.length;
    const uniqueCountries = new Set(allEntries.map(entry => entry.pays).filter(pays => pays && pays !== 'Aucune donnée')).size;
    return { totalEntries, uniqueCountries };
  };

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

        // Fetch all scraped data
        const allData = await dataService.fetchAllScrapedData();
        
        // Group data by scraper name
        const grouped = allData.reduce((acc, entry) => {
          const scraperName = entry.nom || 'Unknown';
          if (!acc[scraperName]) {
            acc[scraperName] = [];
          }
          acc[scraperName].push(entry);
          return acc;
        }, {} as Record<string, ScrapedEntry[]>);
        
        setGroupedData(grouped);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erreur lors du chargement des données');
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

  const toggleGroup = (scraperName: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(scraperName)) {
        newSet.delete(scraperName);
      } else {
        newSet.add(scraperName);
      }
      return newSet;
    });
  };

  const handleExportGroup = (scraperName: string, groupEntries: ScrapedEntry[]) => {
    const csvData = groupEntries.map(entry => ({
      'Nom du Scraper': entry.nom || '-',
      Secteur: entry.secteur === 'Aucune donnée' ? '-' : (entry.secteur || '-'),
      Pays: entry.pays === 'Aucune donnée' ? '-' : (entry.pays || '-'),
      'Site Web': entry.site_web === 'Aucune donnée' ? '-' : (entry.site_web || '-'),
      Email: entry.email === 'Aucune donnée' ? '-' : (entry.email || '-'),
      Téléphone: entry.telephone === 'Aucune donnée' ? '-' : (entry.telephone || '-'),
      Adresse: entry.adresse === 'Aucune donnée' ? '-' : (entry.adresse || '-'),
      'Date de création': new Date(entry.created_at).toLocaleDateString()
    }));

    // Create CSV content
    const headers = Object.keys(csvData[0]);
    const csvContent = "data:text/csv;charset=utf-8," + 
      headers.map(header => escapeCSVValue(header)).join(",") + "\n" +
      csvData.map(row => 
        headers.map(header => escapeCSVValue(row[header])).join(",")
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${scraperName}_donnees.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Export terminé", {
      description: `Les données de ${scraperName} ont été exportées au format CSV.`
    });
  };

  const escapeCSVValue = (value: string): string => {
    if (!value) return '';
    value = value.replace(/"/g, '""');
    if (/[",\n]/.test(value)) {
      value = `"${value}"`;
    }
    return value;
  };

  // Get statistics
  const stats = calculateStats(groupedData);

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
              value={stats.totalEntries.toString()}
              icon={<Database className="h-4 w-4 text-muted-foreground" />}
              description="entreprises collectées"
            />
            <StatsCard
              title="Pays Couverts"
              value={stats.uniqueCountries.toString()}
              icon={<Globe className="h-4 w-4 text-muted-foreground" />}
              description="pays différents"
            />
            <StatsCard
              title="Taux d'enrichissement"
              value={`${((stats.totalEntries / (stats.totalEntries || 1)) * 100).toFixed(0)}%`}
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
              description="données enrichies"
            />
            <StatsCard
              title="Sources de données"
              value={Object.keys(groupedData).length.toString()}
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

          <div className="space-y-4">
            <h3 className="text-xl font-semibold font-heading">Données collectées</h3>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom du Scraper</TableHead>
                    <TableHead>Secteur</TableHead>
                    <TableHead>Pays</TableHead>
                    <TableHead>Site Web</TableHead>
                    <TableHead>Lien</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        Chargement des données...
                      </TableCell>
                    </TableRow>
                  ) : Object.entries(groupedData).length > 0 ? (
                    Object.entries(groupedData).map(([scraperName, entries]) => (
                      <React.Fragment key={scraperName}>
                        <TableRow 
                          className="bg-muted/50 cursor-pointer hover:bg-muted"
                          onClick={() => toggleGroup(scraperName)}
                        >
                          <TableCell colSpan={5}>
                            <div className="flex items-center">
                              {expandedGroups.has(scraperName) ? (
                                <ChevronDown className="h-4 w-4 mr-2" />
                              ) : (
                                <ChevronRight className="h-4 w-4 mr-2" />
                              )}
                              <span className="font-medium">{scraperName}</span>
                              <Badge variant="secondary" className="ml-2">
                                {entries.length}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExportGroup(scraperName, entries);
                              }}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Exporter
                            </Button>
                          </TableCell>
                        </TableRow>
                        {expandedGroups.has(scraperName) && entries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>{entry.nom || '-'}</TableCell>
                            <TableCell>{entry.secteur === 'Aucune donnée' ? '-' : (entry.secteur || '-')}</TableCell>
                            <TableCell>{entry.pays === 'Aucune donnée' ? '-' : (entry.pays || '-')}</TableCell>
                            <TableCell>
                              {entry.site_web && entry.site_web !== 'Aucune donnée' ? (
                                <a
                                  href={entry.site_web.startsWith('http') ? entry.site_web : `https://${entry.site_web}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  <LinkIcon className="h-4 w-4" />
                                  {entry.site_web}
                                </a>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              {entry.lien && entry.lien !== 'Aucune donnée' ? (
                                <a
                                  href={entry.lien.startsWith('http') ? entry.lien : `https://${entry.lien}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  <LinkIcon className="h-4 w-4" />
                                  Voir
                                </a>
                              ) : '-'}
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        Aucune donnée trouvée
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
