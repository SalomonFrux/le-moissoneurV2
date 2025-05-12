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
import { Database, Globe, TrendingUp, Users, ChevronDown, ChevronRight, Download, Mail, Link as LinkIcon, Search, ChevronLeft, ChevronRight as ChevronRightIcon, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { dataService, type Scraper, type Company, type ScrapedEntry } from '@/services/dataService';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [scrapers, setScrapers] = useState<Scraper[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrapedData, setScrapedData] = useState<Record<string, ScrapedEntry[]>>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [groupedData, setGroupedData] = useState<Record<string, ScrapedEntry[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllScrapers, setShowAllScrapers] = useState(false);
  const [selectedScraperData, setSelectedScraperData] = useState<ScrapedEntry[]>([]);
  const [selectedScraperId, setSelectedScraperId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'dataCount'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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
      setSelectedScraperData(data);
      setSelectedScraperId(id);
      toast.info("Affichage des données", {
        description: `${data.length} entrées trouvées`
      });
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    }
  };

  // Filter scrapers based on search query
  const filteredScrapers = scrapers.filter(scraper =>
    scraper.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort and filter scrapers
  const filteredAndSortedScrapers = filteredScrapers
    .sort((a, b) => {
      const aValue = sortBy === 'name' ? a.name.toLowerCase() :
                    sortBy === 'status' ? a.status :
                    a.data_count;
      const bValue = sortBy === 'name' ? b.name.toLowerCase() :
                    sortBy === 'status' ? b.status :
                    b.data_count;
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

  // Calculate pagination
  const totalPages = Math.ceil(filteredAndSortedScrapers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedScrapers = filteredAndSortedScrapers.slice(startIndex, startIndex + itemsPerPage);

  // Get statistics
  const stats = calculateStats(groupedData);

  // Map scrapers to ScraperData format
  const mappedScrapers: ScraperData[] = paginatedScrapers.map(scraper => ({
    id: scraper.id,
    name: scraper.name,
    source: scraper.source,
    status: scraper.status,
    lastRun: scraper.last_run || undefined,
    dataCount: scraper.data_count || 0,
    selectors: { main: scraper.selectors?.main || '' },
    frequency: scraper.frequency,
    country: scraper.country,
    type: scraper.type || 'playwright' 
  }));

  return (
    <div className="space-y-8 p-6">
      <h2 className="text-3xl font-bold font-heading tracking-tight">Tableau de bord</h2>
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-t-africa-green-500 border-r-africa-green-500 border-b-gray-200 border-l-gray-200 animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Database className="h-6 w-6 text-africa-green-500 animate-ping" />
            </div>
          </div>
          <p className="text-lg text-muted-foreground">Chargement des données...</p>
        </div>
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

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold font-heading">Scrapers</h3>
              <div className="flex gap-4 items-center">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un scraper..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-[300px]"
                  />
                </div>
                <Select
                  value={sortBy}
                  onValueChange={(value: 'name' | 'status' | 'dataCount') => setSortBy(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nom</SelectItem>
                    <SelectItem value="status">Statut</SelectItem>
                    <SelectItem value="dataCount">Nombre de données</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {scrapers.length === 0 ? (
              <p>No scrapers available.</p>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {paginatedScrapers.map((scraper) => (
                    <ScraperCard
                      key={scraper.id}
                      scraper={{
                        ...scraper,
                        dataCount: scraper.data_count || 0,
                        type: scraper.type || 'playwright'
                      }}
                      onRunScraper={handleRunScraper}
                      onStopScraper={handleStopScraper}
                      onViewData={handleViewData}
                    />
                  ))}
                </div>
                  
                <div className="flex items-center justify-between border-t pt-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredAndSortedScrapers.length)} sur {filteredAndSortedScrapers.length} scrapers
                    </p>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(value) => setItemsPerPage(Number(value))}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Par page" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="8">8</SelectItem>
                        <SelectItem value="16">16</SelectItem>
                        <SelectItem value="32">32</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(4, totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="icon"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      {totalPages > 4 && (
                        <>
                          <span className="px-2">...</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentPage(totalPages)}
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          {selectedScraperData.length > 0 && (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Données du scraper: {scrapers.find(s => s.id === selectedScraperId)?.name}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedScraperData([])}
                >
                  Fermer
                </Button>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Adresse</TableHead>
                      <TableHead>Secteur</TableHead>
                      <TableHead>Date de collecte</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedScraperData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.nom || '-'}</TableCell>
                        <TableCell>
                          {item.email ? (
                            <a href={`mailto:${item.email}`} className="text-blue-500 hover:underline flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {item.email}
                            </a>
                          ) : '-'}
                        </TableCell>
                        <TableCell>{item.telephone || '-'}</TableCell>
                        <TableCell>{item.adresse || '-'}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {item.secteur || '-'}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
