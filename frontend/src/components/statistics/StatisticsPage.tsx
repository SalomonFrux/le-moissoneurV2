import React, { useEffect, useState, useRef } from 'react';
import { 
  BarChart3, 
  Globe, 
  TrendingUp, 
  PieChart,
  Download,
  Database,
  FileText,
  BarChart2,
  FileSpreadsheet,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SectorDistribution } from './SectorDistribution';
import { GeographicDistribution } from './GeographicDistribution';
import { CollectionTrends } from './CollectionTrends';
import { SourceComparison } from './SourceComparison';
import { dataService, type ScrapedEntry } from '@/services/dataService';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import gsap from 'gsap';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StatisticsData {
  total: number;
  sources: number;
  sectors: number;
  completeness: number;
}

export function StatisticsPage() {
  const [activeTab, setActiveTab] = useState('sectors');
  const [timeRange, setTimeRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatisticsData>({
    total: 0,
    sources: 0,
    sectors: 0,
    completeness: 0
  });
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await dataService.fetchAllScrapedData();
        // Flatten the data structure to get all entries
        const allEntries = data.flatMap(group => group.entries);
        
        // Calculate unique sources and sectors
        const sources = new Set(allEntries.map(d => d.source));
        const sectors = new Set(allEntries.map(d => d.secteur));
        
        // Calculate completeness
        const fields = ['nom', 'email', 'telephone', 'adresse', 'secteur'];
        const totalFields = allEntries.length * fields.length;
        const filledFields = allEntries.reduce((acc, entry) => {
          return acc + fields.filter(field => entry[field] && entry[field] !== 'Aucune donnée').length;
        }, 0);
        
        setStats({
          total: allEntries.length,
          sources: sources.size,
          sectors: sectors.size,
          completeness: Math.round((filledFields / totalFields) * 100)
        });

        // Animate stats cards
        if (statsRef.current) {
          gsap.fromTo(statsRef.current.children,
            { 
              opacity: 0,
              y: 20
            },
            { 
              opacity: 1,
              y: 0,
              duration: 0.5,
              stagger: 0.1,
              ease: 'power2.out'
            }
          );
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        toast.error('Erreur lors du chargement des statistiques');
      } finally {
        setLoading(false);
      }
    }
    
    fetchStats();
  }, [timeRange]);

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      const data = await dataService.fetchAllScrapedData();
      const allEntries = data.flatMap(group => group.entries);
      
      if (format === 'excel') {
        await dataService.exportToExcel({
          data: allEntries,
          sheets: [
            {
              name: 'Résumé',
              data: [
                ['Statistiques Générales'],
                ['Total des entreprises', allEntries.length],
                ['Sources uniques', new Set(allEntries.map(d => d.source)).size],
                ['Secteurs uniques', new Set(allEntries.map(d => d.secteur)).size],
                [''],
                ['Distribution par secteur'],
                ...Object.entries(
                  allEntries.reduce((acc, curr) => {
                    acc[curr.secteur] = (acc[curr.secteur] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([sector, count]) => [sector, count])
              ]
            },
            {
              name: 'Données détaillées',
              data: [
                ['Nom', 'Email', 'Téléphone', 'Adresse', 'Secteur', 'Source', 'Date de collecte'],
                ...allEntries.map(item => [
                  item.nom,
                  item.email,
                  item.telephone,
                  item.adresse,
                  item.secteur,
                  item.source,
                  new Date(item.created_at).toLocaleDateString()
                ])
              ]
            }
          ]
        });
        toast.success('Export Excel réussi');
      } else {
        await dataService.exportToPdf({
          data: allEntries,
          sections: [
            {
              title: 'Résumé',
              content: [
                { type: 'text', text: `Total des entreprises: ${allEntries.length}` },
                { type: 'text', text: `Sources uniques: ${new Set(allEntries.map(d => d.source)).size}` },
                { type: 'text', text: `Secteurs uniques: ${new Set(allEntries.map(d => d.secteur)).size}` }
              ]
            },
            {
              title: 'Distribution par secteur',
              type: 'table',
              headers: ['Secteur', 'Nombre'],
              data: Object.entries(
                allEntries.reduce((acc, curr) => {
                  acc[curr.secteur] = (acc[curr.secteur] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([sector, count]) => [sector, count.toString()])
            },
            {
              title: 'Données détaillées',
              type: 'table',
              headers: ['Nom', 'Email', 'Téléphone', 'Adresse', 'Secteur', 'Source', 'Date'],
              data: allEntries.map(item => [
                item.nom,
                item.email,
                item.telephone,
                item.adresse,
                item.secteur,
                item.source,
                new Date(item.created_at).toLocaleDateString()
              ])
            }
          ]
        });
        toast.success('Export PDF réussi');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Statistiques</h1>
        <div className="flex gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">7 derniers jours</SelectItem>
              <SelectItem value="month">30 derniers jours</SelectItem>
              <SelectItem value="year">12 derniers mois</SelectItem>
              <SelectItem value="all">Toutes les données</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <div className="flex items-center gap-4">
            <Database className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">Total des données</h3>
              <p className="text-2xl font-bold">{loading ? '...' : stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <div className="flex items-center gap-4">
            <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
            <div>
              <h3 className="text-sm font-medium text-green-600 dark:text-green-400">Sources</h3>
              <p className="text-2xl font-bold">{loading ? '...' : stats.sources}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <div className="flex items-center gap-4">
            <BarChart2 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            <div>
              <h3 className="text-sm font-medium text-purple-600 dark:text-purple-400">Secteurs</h3>
              <p className="text-2xl font-bold">{loading ? '...' : stats.sectors}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <div className="flex items-center gap-4">
            <Filter className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            <div>
              <h3 className="text-sm font-medium text-orange-600 dark:text-orange-400">Taux de complétude</h3>
              <p className="text-2xl font-bold">{loading ? '...' : `${stats.completeness}%`}</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="sectors" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Secteurs
          </TabsTrigger>
          <TabsTrigger value="geography" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Géographie
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Tendances
          </TabsTrigger>
          <TabsTrigger value="sources" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Sources
          </TabsTrigger>
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
