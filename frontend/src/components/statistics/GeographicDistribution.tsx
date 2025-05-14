import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { dataService } from '@/services/dataService';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface CountryData {
  pays: string;
  entreprises: number;
  completeness: number;
  mainSectors: string[];
}

interface RegionData {
  name: string;
  value: number;
  percentage: number;
  mainSectors: string[];
}

const COLORS = {
  enterprises: '#2D8B61',
  completeness: '#9C6B22'
};

const REGION_COLORS = ['#2D8B61', '#56BC82', '#8ED6AF', '#BDECD3', '#DCF1E7'];

export function GeographicDistribution() {
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGeographicData() {
      try {
        const data = await dataService.fetchAllScrapedData();
        const allEntries = data.flatMap(group => group.entries);
        
        // Process country data
        const countryData = allEntries.reduce((acc, entry) => {
          const country = entry.pays === 'Aucune donnée' ? 'Non spécifié' : (entry.pays || 'Non spécifié');
          if (!acc[country]) {
            acc[country] = {
              pays: country,
              entreprises: 0,
              completeness: 0,
              mainSectors: new Set<string>()
            };
          }
          acc[country].entreprises++;
          
          // Calculate completeness
          const fields = ['nom', 'email', 'telephone', 'adresse', 'secteur'];
          const filledFields = fields.filter(field => entry[field] && entry[field] !== 'Aucune donnée').length;
          acc[country].completeness += (filledFields / fields.length) * 100;
          
          // Track sectors
          if (entry.secteur && entry.secteur !== 'Aucune donnée') {
            acc[country].mainSectors.add(entry.secteur);
          }
          
          return acc;
        }, {} as Record<string, CountryData>);

        // Convert to array and calculate averages
        const countryArray = Object.values(countryData)
          .map(country => ({
            ...country,
            completeness: Math.round(country.completeness / country.entreprises),
            mainSectors: Array.from(country.mainSectors).slice(0, 3) // Keep top 3 sectors
          }))
          .sort((a, b) => b.entreprises - a.entreprises);

        // Process region data based on countries
        const regionMapping: Record<string, string[]> = {
          'Ouest': ['Sénégal', 'Mali', 'Guinée', 'Guinée-Bissau', 'Mauritanie'],
          'Est': ['Tchad', 'Soudan', 'Éthiopie', 'Djibouti', 'Érythrée'],
          'Sud': ['Congo', 'RDC', 'Angola', 'Namibie', 'Afrique du Sud'],
          'Nord': ['Maroc', 'Algérie', 'Tunisie', 'Libye', 'Égypte'],
          'Centre': ['Cameroun', 'Gabon', 'RCA', 'Guinée équatoriale', 'São Tomé-et-Principe']
        };

        const regionData = Object.entries(regionMapping).reduce((acc, [region, countries]) => {
          const regionEntries = countryArray.filter(country => 
            countries.some(c => country.pays.toLowerCase().includes(c.toLowerCase()))
          );
          
          const total = regionEntries.reduce((sum, country) => sum + country.entreprises, 0);
          const sectors = new Set<string>();
          regionEntries.forEach(country => {
            country.mainSectors.forEach(sector => sectors.add(sector));
          });
          
          acc[region] = {
            name: region,
            value: total,
            percentage: 0, // Will be calculated after
            mainSectors: Array.from(sectors).slice(0, 3)
          };
          
          return acc;
        }, {} as Record<string, RegionData>);

        // Calculate percentages
        const totalRegions = Object.values(regionData).reduce((sum, region) => sum + region.value, 0);
        const regionArray = Object.values(regionData).map(region => ({
          ...region,
          percentage: (region.value / totalRegions) * 100
        }));

        setCountries(countryArray);
        setRegions(regionArray);
      } catch (error) {
        console.error('Error fetching geographic data:', error);
        toast.error('Erreur lors du chargement des données géographiques');
      } finally {
        setLoading(false);
      }
    }
    fetchGeographicData();
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="font-medium">{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} style={{ color: p.color }}>
              {p.name === 'entreprises' ? 'Entreprises: ' : 'Complétude: '}
              {p.value}{p.name === 'completeness' ? '%' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div>Chargement des données géographiques...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-6 lg:col-span-2">
        <h3 className="text-lg font-semibold mb-4">Répartition géographique des entreprises</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={countries}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="pays" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="entreprises" name="Entreprises" fill={COLORS.enterprises} />
              <Bar dataKey="completeness" name="Complétude (%)" fill={COLORS.completeness} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Répartition régionale</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={regions}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {regions.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={REGION_COLORS[index % REGION_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6 lg:col-span-3">
        <h3 className="text-lg font-semibold mb-4">Détails par région</h3>
        <div className="space-y-6">
          {regions.map((region, index) => (
            <div key={region.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: REGION_COLORS[index % REGION_COLORS.length] }}
                    />
                    <span className="font-medium">{region.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Secteurs principaux: {region.mainSectors.join(', ')}
                  </div>
                </div>
                <div className="text-sm">
                  {region.value} entreprises
                </div>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="rounded-full h-2"
                  style={{ 
                    width: `${region.percentage}%`,
                    backgroundColor: REGION_COLORS[index % REGION_COLORS.length]
                  }}
                />
              </div>
              <div className="text-sm text-right">
                {region.percentage.toFixed(1)}% du total
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
