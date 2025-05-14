import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { dataService } from '@/services/dataService';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SourceData {
  name: string;
  entries: number;
  completeness: number;
  mainSectors: {
    name: string;
    count: number;
  }[];
  quality: {
    email: number;
    phone: number;
    address: number;
    website: number;
  };
}

const COLORS = {
  entries: '#2D8B61',
  completeness: '#9C6B22',
  quality: {
    email: '#56BC82',
    phone: '#8ED6AF',
    address: '#BDECD3',
    website: '#DCF1E7'
  }
};

export function SourceComparison() {
  const [sources, setSources] = useState<SourceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSourceData() {
      try {
        const data = await dataService.fetchAllScrapedData();
        
        // Process source data
        const sourceData = data.reduce((acc, group) => {
          const sourceName = group.source || 'Source inconnue';
          
          if (!acc[sourceName]) {
            acc[sourceName] = {
              name: sourceName,
              entries: 0,
              completeness: 0,
              mainSectors: {},
              quality: {
                email: 0,
                phone: 0,
                address: 0,
                website: 0
              }
            };
          }
          
          group.entries.forEach(entry => {
            acc[sourceName].entries++;
            
            // Calculate completeness
            const fields = ['nom', 'email', 'telephone', 'adresse', 'secteur'];
            const filledFields = fields.filter(field => entry[field] && entry[field] !== 'Aucune donnée').length;
            acc[sourceName].completeness += (filledFields / fields.length) * 100;
            
            // Track sectors
            if (entry.secteur && entry.secteur !== 'Aucune donnée') {
              const mainSector = entry.secteur.split(' > ')[0].trim();
              if (!acc[sourceName].mainSectors[mainSector]) {
                acc[sourceName].mainSectors[mainSector] = 0;
              }
              acc[sourceName].mainSectors[mainSector]++;
            }
            
            // Track quality metrics
            if (entry.email && entry.email !== 'Aucune donnée') acc[sourceName].quality.email++;
            if (entry.telephone && entry.telephone !== 'Aucune donnée') acc[sourceName].quality.phone++;
            if (entry.adresse && entry.adresse !== 'Aucune donnée') acc[sourceName].quality.address++;
            if (entry.site_web && entry.site_web !== 'Aucune donnée') acc[sourceName].quality.website++;
          });
          
          return acc;
        }, {} as Record<string, SourceData>);

        // Convert to array and calculate averages
        const sourceArray = Object.values(sourceData)
          .map(source => ({
            ...source,
            completeness: Math.round(source.completeness / source.entries),
            mainSectors: Object.entries(source.mainSectors)
              .map(([name, count]) => ({ name, count }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 3),
            quality: {
              email: (source.quality.email / source.entries) * 100,
              phone: (source.quality.phone / source.entries) * 100,
              address: (source.quality.address / source.entries) * 100,
              website: (source.quality.website / source.entries) * 100
            }
          }))
          .sort((a, b) => b.entries - a.entries);

        setSources(sourceArray);
      } catch (error) {
        console.error('Error fetching source data:', error);
        toast.error('Erreur lors du chargement des données des sources');
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
              {p.name === 'entries' ? 'Entreprises: ' : 
               p.name === 'completeness' ? 'Complétude: ' : 
               p.name === 'email' ? 'Emails: ' :
               p.name === 'phone' ? 'Téléphones: ' :
               p.name === 'address' ? 'Adresses: ' :
               'Sites web: '}
              {p.value.toFixed(1)}{p.name !== 'entries' ? '%' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div>Chargement des données des sources...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Comparaison des sources de données</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sources}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="entries" name="Entreprises" fill={COLORS.entries} />
              <Bar dataKey="completeness" name="Complétude (%)" fill={COLORS.completeness} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Qualité des données par source</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sources}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="quality.email" name="Emails" fill={COLORS.quality.email} />
                <Bar dataKey="quality.phone" name="Téléphones" fill={COLORS.quality.phone} />
                <Bar dataKey="quality.address" name="Adresses" fill={COLORS.quality.address} />
                <Bar dataKey="quality.website" name="Sites web" fill={COLORS.quality.website} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Secteurs principaux par source</h3>
          <div className="space-y-6">
            {sources.map((source, index) => (
              <div key={source.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS.entries }}
                      />
                      <span className="font-medium">{source.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {source.entries} entreprises
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  {source.mainSectors.map((sector, sectorIndex) => (
                    <div key={sector.name} className="flex justify-between text-sm">
                      <span>{sector.name}</span>
                      <span className="font-medium">{sector.count} entreprises</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
