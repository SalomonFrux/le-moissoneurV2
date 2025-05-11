import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { dataService } from '@/services/dataService';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface SourceData {
  name: string;
  companies: number;
  completeness: number;
  mainSectors: string[];
}

const COLORS = {
  companies: '#000000',
  completeness: '#777777'
};

const PIE_COLORS = ['#000000', '#222222', '#444444', '#666666', '#888888', '#AAAAAA'];

export function SourceComparison() {
  const [sources, setSources] = useState<SourceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSourceData() {
      try {
        const data = await dataService.fetchAllScrapedData();
        
        // Process source data
        const sourceData = data.reduce((acc, entry) => {
          const source = entry.source || 'Non spécifié';
          if (!acc[source]) {
            acc[source] = {
              name: source,
              companies: 0,
              completeness: 0,
              mainSectors: new Set<string>()
            };
          }
          acc[source].companies++;
          
          // Calculate completeness based on filled fields
          const fields = ['nom', 'email', 'telephone', 'adresse', 'secteur'];
          const filledFields = fields.filter(field => entry[field] && entry[field] !== 'Aucune donnée').length;
          acc[source].completeness += (filledFields / fields.length) * 100;
          
          // Track sectors
          if (entry.secteur && entry.secteur !== 'Aucune donnée') {
            acc[source].mainSectors.add(entry.secteur);
          }
          
          return acc;
        }, {} as Record<string, { 
          name: string; 
          companies: number; 
          completeness: number; 
          mainSectors: Set<string>;
        }>);

        // Convert to array and calculate averages
        const sourceArray = Object.values(sourceData)
          .map(source => ({
            ...source,
            completeness: Math.round(source.completeness / source.companies),
            mainSectors: Array.from(source.mainSectors).slice(0, 3) // Keep top 3 sectors
          }))
          .sort((a, b) => b.companies - a.companies);

        setSources(sourceArray);
      } catch (error) {
        console.error('Error fetching source data:', error);
        toast.error('Erreur lors du chargement des données sources');
      } finally {
        setLoading(false);
      }
    }
    fetchSourceData();
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="font-medium">{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} style={{ color: p.color }}>
              {p.name === 'companies' ? 'Entreprises: ' : 'Complétude: '}
              {p.value}{p.name === 'completeness' ? '%' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div>Chargement des données sources...</div>;
  }

  const pieData = sources.map(source => ({
    name: source.name,
    value: source.companies
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Comparaison des sources de données</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sources}
              layout="vertical"
              margin={{
                top: 20,
                right: 30,
                left: 100,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="companies" name="Entreprises" fill={COLORS.companies} />
              <Bar dataKey="completeness" name="Complétude (%)" fill={COLORS.completeness} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Répartition des données par source</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6 lg:col-span-2">
        <h3 className="text-lg font-semibold mb-4">Qualité des données par source</h3>
        <div className="space-y-6">
          {sources.map((source, index) => (
            <div key={source.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    <span className="font-medium">{source.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Secteurs principaux: {source.mainSectors.join(', ')}
                  </div>
                </div>
                <div className="text-sm">
                  {source.companies} entreprises
                </div>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="rounded-full h-2"
                  style={{ 
                    width: `${source.completeness}%`,
                    backgroundColor: PIE_COLORS[index % PIE_COLORS.length]
                  }}
                />
              </div>
              <div className="text-sm text-right">
                {source.completeness}% complet
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
