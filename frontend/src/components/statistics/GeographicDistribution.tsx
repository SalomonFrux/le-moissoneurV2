import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { dataService } from '@/services/dataService';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface CountryData {
  pays: string;
  entreprises: number;
  investments: number;
}

interface RegionData {
  name: string;
  value: number;
  percentage: number;
}

const COLORS = {
  enterprises: '#2D8B61',
  investments: '#9C6B22'
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
        
        // Process country data
        const countryData = data.reduce((acc, entry) => {
          const country = entry.pays === 'Aucune donnée' ? 'Non spécifié' : (entry.pays || 'Non spécifié');
          if (!acc[country]) {
            acc[country] = {
              pays: country,
              entreprises: 0,
              investments: Math.floor(Math.random() * 100) // Simulated investment data
            };
          }
          acc[country].entreprises++;
          return acc;
        }, {} as Record<string, CountryData>);

        // Convert to array and sort
        const countryArray = Object.values(countryData)
          .sort((a, b) => b.entreprises - a.entreprises);

        // Process region data (simulated)
        const regions = [
          { name: 'Ouest', value: 35 },
          { name: 'Est', value: 25 },
          { name: 'Sud', value: 20 },
          { name: 'Nord', value: 15 },
          { name: 'Centre', value: 5 }
        ];

        const totalRegions = regions.reduce((sum, region) => sum + region.value, 0);
        const regionArray = regions.map(region => ({
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
              {p.name === 'entreprises' ? 'Entreprises: ' : 'Investissements: '}
              {p.value} {p.name === 'investments' ? 'M$' : ''}
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
              <Bar dataKey="investments" name="Investissements (M$)" fill={COLORS.investments} />
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
    </div>
  );
}
