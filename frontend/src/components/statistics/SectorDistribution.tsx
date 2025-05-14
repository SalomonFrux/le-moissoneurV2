import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { dataService } from '@/services/dataService';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

// Importing Google Font
import './styles.css'; // Ensure this file contains the font import

interface SectorData {
  name: string;
  value: number;
  percentage: number;
  subsectors: {
    name: string;
    value: number;
    percentage: number;
  }[];
}

// Mise à jour des couleurs
const COLORS = [
    '#15616D', // Caribbean Current
    '#FF7D00', // Orange Wheel
    '#78290F', // Sienna
    '#001524', // Rich Black
    '#FFECD1'  // Papaya Whip
];

// ... code existant pour le graphique ...
const MAX_SECTORS = 4; // Nombre maximum de secteurs à afficher avant de grouper en 'Autres'

export function SectorDistribution() {
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSectorData() {
      try {
        const data = await dataService.fetchAllScrapedData();
        const allEntries = data.flatMap(group => group.entries);
        
        // Process sector data
        const sectorData = allEntries.reduce((acc, entry) => {
          if (!entry.secteur || entry.secteur === 'Aucune donnée') return acc;
          
          // Split sector into main sector and subsector
          const [mainSector, subsector] = entry.secteur.split(' > ').map(s => s.trim());
          
          if (!acc[mainSector]) {
            acc[mainSector] = {
              name: mainSector,
              value: 0,
              percentage: 0,
              subsectors: {} // Use object for counting, will convert to array later
            };
          }
          
          acc[mainSector].value++;
          
          // Track subsectors
          if (subsector) {
            if (!acc[mainSector].subsectors[subsector]) {
              acc[mainSector].subsectors[subsector] = {
                name: subsector,
                value: 0,
                percentage: 0
              };
            }
            acc[mainSector].subsectors[subsector].value++;
          }
          
          return acc;
        }, {} as Record<string, Omit<SectorData, 'subsectors'> & { subsectors: Record<string, { name: string; value: number; percentage: number }> }>);

        // Calculate percentages and convert to arrays
        const total = Object.values(sectorData).reduce((sum, sector) => sum + sector.value, 0);
        
        const sectorArray = Object.values(sectorData)
          .map(sector => {
            const subsectorArray = Object.values(sector.subsectors)
              .map(subsector => ({
                ...subsector,
                percentage: (subsector.value / sector.value) * 100
              }))
              .sort((a, b) => b.value - a.value);

            return {
              ...sector,
              percentage: (sector.value / total) * 100,
              subsectors: subsectorArray
            };
          })
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

  // Only show top N sectors, group the rest as 'Autres' for the chart/legend
  const topSectors = sectors.slice(0, MAX_SECTORS);
  const otherSectors = sectors.slice(MAX_SECTORS);
  const autresValue = otherSectors.reduce((sum, s) => sum + s.value, 0);
  const autresPercentage = otherSectors.reduce((sum, s) => sum + s.percentage, 0);
  const chartData = autresValue > 0
    ? [...topSectors, { name: `Autres (${otherSectors.length})`, value: autresValue, percentage: autresPercentage, subsectors: [] }]
    : topSectors;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="font-medium">{data.name}</p>
          <p>{data.value} entreprises</p>
          <p>{data.percentage.toFixed(1)}%</p>
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
        <h3 className="modern-font text-lg font-semibold mb-4">Répartition par secteur d'activité - Top {MAX_SECTORS} secteurs</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                onClick={(data) => {
                  if (data.name.startsWith('Autres')) return;
                  setSelectedSector(data.name);
                }}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    style={{ 
                      cursor: entry.name.startsWith('Autres') ? 'not-allowed' : 'pointer',
                      opacity: selectedSector ? (selectedSector === entry.name ? 1 : 0.5) : 1
                    }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }} // Smaller font for legend
                layout="vertical"
                verticalAlign="middle"
                align="right"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {chartData.map((sector, idx) => (
            <button
              key={sector.name}
              className={`px-2 py-1 rounded text-xs ${selectedSector === sector.name ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'} ${sector.name.startsWith('Autres') ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={() => {
                if (!sector.name.startsWith('Autres')) setSelectedSector(sector.name);
              }}
              disabled={sector.name.startsWith('Autres')}
            >
              {sector.name}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="modern-font text-lg font-semibold mb-4">
          {selectedSector ? `Sous-secteurs de ${selectedSector}` : 'Sélectionnez un secteur'}
        </h3>
        <div className="mb-4">
          <Select
            value={selectedSector || ''}
            onValueChange={setSelectedSector}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionnez un secteur" />
            </SelectTrigger>
            <SelectContent>
              {sectors.map(sector => (
                <SelectItem key={sector.name} value={sector.name}>{sector.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-6">
          {selectedSector ? (
            sectors
              .find(s => s.name === selectedSector)
              ?.subsectors.map((subsector, index) => (
                <div key={subsector.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{subsector.name}</span>
                      </div>
                    </div>
                    <div className="text-sm">
                      {subsector.value} entreprises
                    </div>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="rounded-full h-2"
                      style={{ 
                        width: `${subsector.percentage}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    />
                  </div>
                  <div className="text-sm text-right">
                    {subsector.percentage.toFixed(1)}% du secteur
                  </div>
                </div>
              ))
          ) : (
            <div className="text-center text-muted-foreground">
              Cliquez sur un secteur pour voir ses sous-secteurs
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}