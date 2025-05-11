import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { dataService } from '@/services/dataService';
import { toast } from 'sonner';

interface SectorData {
  name: string;
  count: number;
  percentage: number;
}

export function SectorDistribution() {
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSectorData() {
      try {
        const data = await dataService.fetchAllScrapedData();
        
        // Count entries by sector
        const sectorCounts = data.reduce((acc, entry) => {
          const sector = entry.secteur === 'Aucune donnée' ? 'Non spécifié' : (entry.secteur || 'Non spécifié');
          acc[sector] = (acc[sector] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Convert to array and calculate percentages
        const total = Object.values(sectorCounts).reduce((sum, count) => sum + count, 0);
        const sectorArray = Object.entries(sectorCounts)
          .map(([name, count]) => ({
            name,
            count,
            percentage: (count / total) * 100
          }))
          .sort((a, b) => b.count - a.count);

        setSectors(sectorArray);
      } catch (error) {
        console.error('Error fetching sector data:', error);
        toast.error('Erreur lors du chargement des données sectorielles');
      } finally {
        setLoading(false);
      }
    }
    fetchSectorData();
  }, []);

  if (loading) {
    return <div>Chargement des données sectorielles...</div>;
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Distribution par Secteur</h3>
      <div className="space-y-4">
        {sectors.map((sector) => (
          <div key={sector.name} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{sector.name}</span>
              <span className="font-medium">{sector.count}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary rounded-full h-2"
                style={{ width: `${sector.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
