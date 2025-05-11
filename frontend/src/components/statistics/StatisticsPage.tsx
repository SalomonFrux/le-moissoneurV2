import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  Globe, 
  TrendingUp, 
  PieChart,
  CalendarRange
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SectorDistribution } from './SectorDistribution';
import { GeographicDistribution } from './GeographicDistribution';
import { CollectionTrends } from './CollectionTrends';
import { SourceComparison } from './SourceComparison';
import { dataService } from '@/services/dataService';
import { toast } from 'sonner';

interface StatisticsSummary {
  companies: number;
  companiesChange: number;
  countries: number;
  sectors: number;
  growth: number;
  countriesLabel: string;
  sectorsLabel: string;
  growthLabel: string;
}

export function StatisticsPage() {
  const [summary, setSummary] = useState<StatisticsSummary>({
    companies: 0,
    companiesChange: 0,
    countries: 0,
    sectors: 0,
    growth: 0,
    countriesLabel: '',
    sectorsLabel: '',
    growthLabel: '',
  });
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all');

  useEffect(() => {
    async function fetchSummary() {
      setLoading(true);
      try {
        // Fetch all scraped data
        const scrapedData = await dataService.fetchAllScrapedData();
        
        // Calculate total unique companies (based on unique names)
        const uniqueCompanies = new Set(scrapedData.map(entry => entry.nom)).size;
        
        // Calculate unique countries
        const uniqueCountries = new Set(scrapedData.map(entry => entry.pays).filter(pays => pays && pays !== 'Aucune donnée')).size;
        
        // Calculate unique sectors
        const uniqueSectors = new Set(scrapedData.map(entry => entry.secteur).filter(secteur => secteur && secteur !== 'Aucune donnée')).size;
        
        // Calculate growth (companies added in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentEntries = scrapedData.filter(entry => 
          new Date(entry.created_at) > thirtyDaysAgo
        ).length;
        
        const growthRate = scrapedData.length > 0 
          ? ((recentEntries / scrapedData.length) * 100).toFixed(1)
          : 0;

        // Get previous period data for comparison
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        
        const previousPeriodEntries = scrapedData.filter(entry =>
          new Date(entry.created_at) > sixtyDaysAgo &&
          new Date(entry.created_at) <= thirtyDaysAgo
        ).length;

        const companiesChangeRate = previousPeriodEntries > 0
          ? ((recentEntries - previousPeriodEntries) / previousPeriodEntries * 100).toFixed(1)
          : 100;

        setSummary({
          companies: uniqueCompanies,
          companiesChange: Number(companiesChangeRate),
          countries: uniqueCountries,
          sectors: uniqueSectors,
          growth: Number(growthRate),
          countriesLabel: `${uniqueCountries} pays différents identifiés`,
          sectorsLabel: `${uniqueSectors} secteurs d'activité`,
          growthLabel: `Croissance sur 30 jours`
        });
      } catch (error) {
        console.error('Error in StatisticsPage:', error);
        toast.error('Erreur lors du chargement des statistiques');
        setSummary({
          companies: 0,
          companiesChange: 0,
          countries: 0,
          sectors: 0,
          growth: 0,
          countriesLabel: "Erreur de chargement",
          sectorsLabel: "Erreur de chargement",
          growthLabel: "Erreur de chargement"
        });
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, [timeframe]);

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-3xl font-bold font-heading tracking-tight">Statistiques</h2>
        <div className="flex items-center gap-2">
          <select 
            className="rounded-md border border-input px-3 py-1 text-sm bg-background"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          >
            <option value="all">Toutes les données</option>
            <option value="month">Dernier mois</option>
            <option value="quarter">Dernier trimestre</option>
            <option value="year">Dernière année</option>
          </select>
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground h-8 px-4 py-1">
            Exporter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Entreprises
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : summary.companies}</div>
            <p className="mt-2 text-xs text-muted-foreground flex items-center">
              <span className={`mr-1 inline-flex items-center rounded-md px-1 py-0.5 text-xs font-medium ${
                summary.companiesChange > 0 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
              }`}>
                {loading ? '...' : `${summary.companiesChange > 0 ? '+' : ''}${summary.companiesChange}%`}
              </span>
              depuis le mois dernier
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pays
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : summary.countries}</div>
            <p className="mt-2 text-xs text-muted-foreground">
              {loading ? '...' : summary.countriesLabel}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Secteurs
            </CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : summary.sectors}</div>
            <p className="mt-2 text-xs text-muted-foreground">
              {loading ? '...' : summary.sectorsLabel}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Croissance
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : `${summary.growth > 0 ? '+' : ''}${summary.growth}%`}</div>
            <p className="mt-2 text-xs text-muted-foreground">
              {loading ? '...' : summary.growthLabel}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sectors" className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="sectors">Secteurs</TabsTrigger>
          <TabsTrigger value="geography">Géographie</TabsTrigger>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
        </TabsList>
        <TabsContent value="sectors">
          <SectorDistribution />
        </TabsContent>
        <TabsContent value="geography">
          <GeographicDistribution />
        </TabsContent>
        <TabsContent value="trends">
          <CollectionTrends />
        </TabsContent>
        <TabsContent value="sources">
          <SourceComparison />
        </TabsContent>
      </Tabs>
    </div>
  );
}
