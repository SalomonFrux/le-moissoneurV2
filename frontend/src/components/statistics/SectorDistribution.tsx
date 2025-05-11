import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { dataService } from '@/services/dataService';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface SectorData {
  name: string;
  value: number;
  percentage: number;
}

const COLORS = {
  Fintech: '#15616D',
  'E-commerce': '#FF7D00',
  Edtech: '#78290F',
  Agritech: '#001524',
  Santé: '#FFECD1',
  Autres: '#A83E32'
};

const DEFAULT_COLORS = ['#15616D', '#FF7D00', '#78290F', '#001524', '#FFECD1', '#A83E32'];

export function SectorDistribution() {
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSectorData() {
      try {
        const data = await dataService.fetchAllScrapedData();
        
        // Count entries by sector
        const sectorCounts = data.reduce((acc, entry) => {
          const sector = entry.secteur === 'Aucune donnée' ? 'Autres' : (entry.secteur || 'Autres');
          acc[sector] = (acc[sector] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Convert to array and calculate percentages
        const total = Object.values(sectorCounts).reduce((sum, count) => sum + count, 0);
        const sectorArray = Object.entries(sectorCounts)
          .map(([name, count]) => ({
            name,
            value: count,
            percentage: (count / total) * 100
          }))
          .sort((a, b) => b.value - a.value);

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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="font-medium">{payload[0].name}</p>
          <p>{payload[0].value} entreprises</p>
          <p>{payload[0].payload.percentage.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div>Chargement des données sectorielles...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Répartition par secteur d'activité</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sectors}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {sectors.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.name as keyof typeof COLORS] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top 5 sous-secteurs Fintech</h3>
        <div className="space-y-4">
          {sectors.slice(0, 5).map((sector, index) => (
            <div key={sector.name} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{sector.name}</span>
                <span className="font-medium">{sector.value} entreprises</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="rounded-full h-2"
                  style={{ 
                    width: `${sector.percentage}%`,
                    backgroundColor: COLORS[sector.name as keyof typeof COLORS] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
