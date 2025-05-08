
import React from 'react';
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

export function StatisticsPage() {
  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-3xl font-bold font-heading tracking-tight">Statistiques</h2>
        <div className="flex items-center gap-2">
          <select className="rounded-md border border-input px-3 py-1 text-sm bg-background">
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
            <div className="text-2xl font-bold">258</div>
            <p className="mt-2 text-xs text-muted-foreground flex items-center">
              <span className="mr-1 inline-flex items-center rounded-md px-1 py-0.5 text-xs font-medium bg-green-50 text-green-700">
                +12%
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
            <div className="text-2xl font-bold">14</div>
            <p className="mt-2 text-xs text-muted-foreground flex items-center">
              Afrique de l'Ouest principalement
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
            <div className="text-2xl font-bold">18</div>
            <p className="mt-2 text-xs text-muted-foreground flex items-center">
              Tech et Fintech dominants
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
            <div className="text-2xl font-bold">+23%</div>
            <p className="mt-2 text-xs text-muted-foreground flex items-center">
              Taux de croissance trimestriel
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
