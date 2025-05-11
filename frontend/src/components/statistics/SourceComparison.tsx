import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { dataService } from '@/services/dataService';
import { toast } from 'sonner';

interface SourceData {
  name: string;
  count: number;
  percentage: number;
  completeness: number;
}

export function SourceComparison() {
  const [sources, setSources] = useState<SourceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSourceData() {
      try {
        const data = await dataService.fetchAllScrapedData();
        
        // Group entries by source
        const sourceGroups = data.reduce((acc, entry) => {
          const source = entry.nom || 'Non spécifié';
          if (!acc[source]) {
            acc[source] = {
              count: 0,
              complete: 0,
              entries: []
            };
          }
          acc[source].count++;
          acc[source].entries.push(entry);
          
          // Calculate completeness (percentage of non-empty fields)
          const fields = ['secteur', 'pays', 'site_web', 'email', 'telephone', 'adresse'];
          const completedFields = fields.filter(field => 
            entry[field] && entry[field] !== 'Aucune donnée'
          ).length;
          acc[source].complete += (completedFields / fields.length);
          
          return acc;
        }, {} as Record<string, { count: number; complete: number; entries: any[] }>);

        // Convert to array and calculate percentages
        const total = Object.values(sourceGroups).reduce((sum, group) => sum + group.count, 0);
        const sourceArray = Object.entries(sourceGroups)
          .map(([name, data]) => ({
            name,
            count: data.count,
            percentage: (data.count / total) * 100,
            completeness: (data.complete / data.count) * 100
          }))
          .sort((a, b) => b.count - a.count);

        setSources(sourceArray);
      } catch (error) {
        console.error('Error fetching source data:', error);
        toast.error('Erreur lors du chargement des données par source');
      } finally {
        setLoading(false);
      }
    }
    fetchSourceData();
  }, []);

  if (loading) {
    return <div>Chargement des données par source...</div>;
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Comparaison des Sources</h3>
      <div className="space-y-6">
        {sources.map((source) => (
          <div key={source.name} className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{source.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {source.count} entreprises ({source.percentage.toFixed(1)}%)
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  Complétude
                </p>
                <p className="text-sm text-muted-foreground">
                  {source.completeness.toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary rounded-full h-2"
                  style={{ width: `${source.percentage}%` }}
                />
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-green-500 rounded-full h-2"
                  style={{ width: `${source.completeness}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
