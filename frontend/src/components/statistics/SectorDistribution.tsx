import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';

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
    '#FF6F61'  // Soft Coral
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
        // Get sector statistics with a single query
        const { data: sectorStats, error } = await supabase
          .from('scraped_data')
          .select('secteur')
          .not('secteur', 'is', null)
          .not('secteur', 'eq', 'Aucune donnée')
          .not('secteur', 'ilike', 'unknown');

        if (error) throw error;

        // Process sector data
        const sectorMap: Record<string, SectorData> = {};
        
        (sectorStats || []).forEach(({ secteur }) => {
          // Split sector into main sector and subsector
          const [mainSector, subsector] = secteur.split(' > ').map(s => s.trim());
          
          if (!mainSector || mainSector.toLowerCase() === 'unknown') return;
          
          if (!sectorMap[mainSector]) {
            sectorMap[mainSector] = {
              name: mainSector,
              value: 0,
              percentage: 0,
              subsectors: []
            };
          }
          
          sectorMap[mainSector].value++;
          
          // Track subsectors if they are valid
          if (subsector && subsector.toLowerCase() !== 'unknown') {
            let subsectorData = sectorMap[mainSector].subsectors.find(s => s.name === subsector);
            if (!subsectorData) {
              subsectorData = {
                name: subsector,
                value: 0,
                percentage: 0
              };
              sectorMap[mainSector].subsectors.push(subsectorData);
            }
            subsectorData.value++;
          }
        });

        // Calculate percentages and sort
        const total = Object.values(sectorMap).reduce((sum, sector) => sum + sector.value, 0);
        
        const sectorArray = Object.values(sectorMap)
          .map(sector => ({
            ...sector,
            percentage: (sector.value / total) * 100,
            subsectors: sector.subsectors.map(subsector => ({
              ...subsector,
              percentage: (subsector.value / sector.value) * 100
            })).sort((a, b) => b.value - a.value)
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
    <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 w-full"> {/* Ensure the grid takes full width */}
      <Card className="p-6 w-full"> {/* Ensure the card takes full width */}
        <h3 className="modern-font text-lg font-semibold mb-4">Répartition par secteur d'activité - Top {MAX_SECTORS} secteurs</h3>
        
        <div className="mb-4 flex justify-between items-center"> {/* Use flex to align items */}
          <div className="flex-grow"> {/* Allow the title to take available space */}
            {/* Title or any other content can go here if needed */}
          </div>
          <Select
            value={selectedSector || ''}
            onValueChange={setSelectedSector}
          >
            <SelectTrigger className="w-1/5"> {/* Set a fixed width for the selector */}
              <SelectValue placeholder="Sélectionnez un secteur" />
            </SelectTrigger>
            <SelectContent>
              {sectors.map(sector => (
                <SelectItem key={sector.name} value={sector.name}>{sector.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
    </div>
  );
}