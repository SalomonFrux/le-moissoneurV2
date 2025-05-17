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
import { Card } from '@/components/ui/card';
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
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Importing Google Font
import './styles.css'; // Ensure this file contains the font import

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
        // Fetch statistics using database aggregation
        const stats = await dataService.fetchDashboardStats();
        
        setStats({
          total: stats.totalEntries,
          sources: stats.uniqueScrapers,
          sectors: stats.uniqueSectors,
          completeness: stats.completeness
        });

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
                ).map(([sector, count]) => [sector, count.toString()])
              ]
            },
            {
              name: 'Données détaillées',
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
        toast.success('Export Excel réussi');
      } else {
        // PDF export: use GET, no options
        const blob = await dataService.exportToPdf();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `export-${new Date().toISOString()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('Export PDF réussi');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export');
    }
  };

  // Chunked CSV export for large datasets
  const CHUNK_SIZE = 100000;
  const handleCsvExport = async () => {
    try {
      const data = await dataService.fetchAllScrapedData();
      const allEntries = data.flatMap(group => group.entries);
      if (allEntries.length === 0) {
        toast.error('Aucune donnée à exporter');
        return;
      }
      const headers = ['Nom', 'Email', 'Téléphone', 'Adresse', 'Secteur', 'Source', 'Date'];
      const totalChunks = Math.ceil(allEntries.length / CHUNK_SIZE);
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min((i + 1) * CHUNK_SIZE, allEntries.length);
        const chunk = allEntries.slice(start, end);
        const rows = chunk.map(item => [
          item.nom,
          item.email,
          item.telephone,
          item.adresse,
          item.secteur,
          item.source,
          new Date(item.created_at).toLocaleDateString()
        ]);
        const csvContent = [headers, ...rows]
          .map(row => row.map(val => {
            if (val == null) return '';
            const str = String(val).replace(/"/g, '""');
            return /[",\n]/.test(str) ? `"${str}"` : str;
          }).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `export-part${i + 1}-${new Date().toISOString()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        // Add delay between chunks to prevent browser overload
        if (totalChunks > 1) await new Promise(resolve => setTimeout(resolve, 1000));
      }
      toast.success(`Export CSV terminé (${totalChunks} fichier(s))`);
    } catch (error) {
      console.error('Export CSV error:', error);
      toast.error('Erreur lors de l\'export CSV');
    }
  };

  // PDF export of dashboard charts (visible content)
  const handlePdfExportCharts = async () => {
    try {
      const dashboardNode = document.querySelector('.space-y-6.p-6'); // Main dashboard container
      if (!dashboardNode) {
        toast.error('Impossible de trouver le contenu à exporter');
        return;
      }
      toast('Génération du PDF en cours...');
      // Use html2canvas to capture the dashboard as an image
      const canvas = await html2canvas(dashboardNode as HTMLElement, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      // Calculate image size to fit A4
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = canvas.height * (pageWidth / canvas.width);
      let y = 0;
      // If the image is taller than one page, split it
      if (imgHeight < pageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      } else {
        let position = 0;
        let remainingHeight = imgHeight;
        while (remainingHeight > 0) {
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          remainingHeight -= pageHeight;
          if (remainingHeight > 0) {
            pdf.addPage();
            position -= pageHeight;
          }
        }
      }
      pdf.save(`dashboard-charts-${new Date().toISOString()}.pdf`);
      toast.success('Export PDF des graphiques réussi');
    } catch (error) {
      console.error('Export PDF charts error:', error);
      toast.error('Erreur lors de l\'export PDF des graphiques');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="modern-font text-3xl font-bold">Statistiques</h1>
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
              <DropdownMenuItem onClick={handleCsvExport}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exporter CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePdfExportCharts}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                PDF (graphiques)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="modern-card">
          <div className="icon-container">
            <Database className="icon" />
          </div>
          <div className="flex flex-col gap-2 items-start p-6 z-10 relative">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-700">Total des données</span>
            <span className="text-4xl font-extrabold text-gray-900 dark:text-gray-200 drop-shadow">{loading ? '...' : stats.total}</span>
            <span className="text-xs text-muted-foreground">Entreprises collectées</span>
          </div>
        </Card>
        <Card className="modern-card">
          <div className="icon-container">
            <FileText className="icon" />
          </div>
          <div className="flex flex-col gap-2 items-start p-6 z-10 relative">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-700">Sources</span>
            <span className="text-4xl font-extrabold text-gray-900 dark:text-gray-200 drop-shadow">{loading ? '...' : stats.sources}</span>
            <span className="text-xs text-muted-foreground">Sources de données</span>
          </div>
        </Card>
        <Card className="modern-card">
          <div className="icon-container">
            <BarChart2 className="icon" />
          </div>
          <div className="flex flex-col gap-2 items-start p-6 z-10 relative">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-700">Secteurs</span>
            <span className="text-4xl font-extrabold text-gray-900 dark:text-gray-200 drop-shadow">{loading ? '...' : stats.sectors}</span>
            <span className="text-xs text-muted-foreground">Secteurs uniques</span>
          </div>
        </Card>
        <Card className="modern-card">
          <div className="icon-container">
            <Filter className="icon" />
          </div>
          <div className="flex flex-col gap-2 items-start p-6 z-10 relative">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-700">Taux de complétude</span>
            <span className="text-4xl font-extrabold text-gray-900 dark:text-gray-200 drop-shadow">{loading ? '...' : `${stats.completeness}%`}</span>
            <span className="text-xs text-muted-foreground">Champs complétés</span>
          </div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="sectors" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            <span className="modern-font">Secteurs</span>
          </TabsTrigger>
          <TabsTrigger value="geography" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="modern-font">Géographie</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="modern-font">Tendances</span>
          </TabsTrigger>
          <TabsTrigger value="sources" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="modern-font">Sources</span>
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