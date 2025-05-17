import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { dataService, ScrapedEntry } from '@/services/dataService';
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
  const [expandedSectors, setExpandedSectors] = useState<{ [key: string]: boolean }>({}); // State to manage expansion of sectors

  useEffect(() => {
    async function fetchSourceData() {
      try {
        const data = await dataService.fetchAllScrapedData();
        console.log('Raw data from API:', data);
        
        // First, collect all unique scraper IDs and their entries
        const scraperGroups = new Map<string, ScrapedEntry[]>();
        
        data.forEach(group => {
          group.entries.forEach(entry => {
            if (entry.scraper_id) {
              if (!scraperGroups.has(entry.scraper_id)) {
                scraperGroups.set(entry.scraper_id, []);
              }
              scraperGroups.get(entry.scraper_id)?.push(entry);
            }
          });
        });

        console.log('Scraper groups:', scraperGroups);
        
        // Process each unique scraper
        const sourceData = await Promise.all(
          Array.from(scraperGroups.entries()).map(async ([scraperId, entries]) => {
            const scraper = await dataService.fetchScraperById(scraperId);
            console.log('Fetched scraper:', scraper);
            
            if (!scraper) {
              console.warn('No scraper found for ID:', scraperId);
              return null;
            }

            const acc = {
              name: scraper.name,
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

            entries.forEach(entry => {
              acc.entries++;
              
              // Calculate completeness
              const fields = ['nom', 'email', 'telephone', 'adresse', 'secteur'];
              const filledFields = fields.filter(field => entry[field] && entry[field] !== 'Aucune donnée').length;
              acc.completeness += (filledFields / fields.length) * 100;
              
              // Track sectors
              if (entry.secteur && entry.secteur !== 'Aucune donnée') {
                const mainSector = entry.secteur.split(' > ')[0].trim();
                if (!acc.mainSectors[mainSector]) {
                  acc.mainSectors[mainSector] = 0;
                }
                acc.mainSectors[mainSector]++;
              }
              
              // Track quality metrics
              if (entry.email && entry.email !== 'Aucune donnée') acc.quality.email++;
              if (entry.telephone && entry.telephone !== 'Aucune donnée') acc.quality.phone++;
              if (entry.adresse && entry.adresse !== 'Aucune donnée') acc.quality.address++;
              if (entry.site_web && entry.site_web !== 'Aucune donnée') acc.quality.website++;
            });
            
            return acc;
          })
        );

        // Filter out null values and calculate averages
        const sourceArray = sourceData
          .filter((source): source is NonNullable<typeof source> => source !== null)
          .map(source => ({
            ...source,
            completeness: Math.round(source.completeness / source.entries),
            mainSectors: Object.entries(source.mainSectors)
              .map(([name, count]) => ({ name, count: Number(count) }))
              .sort((a, b) => Number(b.count) - Number(a.count))
              .slice(0, 3),
            quality: {
              email: (source.quality.email / source.entries) * 100,
              phone: (source.quality.phone / source.entries) * 100,
              address: (source.quality.address / source.entries) * 100,
              website: (source.quality.website / source.entries) * 100
            }
          }))
          .sort((a, b) => b.entries - a.entries);

        console.log('Processed source data:', sourceArray);
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
            <p key={p.dataKey} style={{ color: p.color }}>
              {p.dataKey === 'quality.email' ? 'Emails: ' :
               p.dataKey === 'quality.phone' ? 'Téléphones: ' :
               p.dataKey === 'quality.address' ? 'Adresses: ' :
               p.dataKey === 'quality.website' ? 'Sites web: ' :
               p.dataKey === 'entries' ? 'Entreprises: ' :
               p.dataKey === 'completeness' ? 'Complétude: ' :
               p.dataKey}
              {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}{p.dataKey !== 'entries' && p.dataKey !== 'name' ? '%' : ''}
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

  const toggleSectorExpansion = (sourceName: string) => {
    setExpandedSectors((prev) => ({
      ...prev,
      [sourceName]: !prev[sourceName],
    }));
  };

return (
  <div className="space-y-6">
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Qualité des données par source - 5 Meilleurs sources</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sources
              .sort((a, b) => b.quality.email - a.quality.email) // Sort by email quality (or any other criterion)
              .slice(0, 5)} // Get the top 6 sources
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
            <Bar dataKey="quality.email" name="Emails" fill="#15616D" />
            <Bar dataKey="quality.phone" name="Téléphones" fill="#FF7D00" />
            <Bar dataKey="quality.address" name="Adresses" fill="#78290F" />
            <Bar dataKey="quality.website" name="Sites web" fill="#001524" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {sources
        .sort((a, b) => b.entries - a.entries) // Sort by entries (or any other criterion)
        .slice(0, 5) // Get the top 6 sources
        .map((source) => (
          <Card key={source.name} className="p-6 overflow-hidden transition-all duration-300 ease-in-out">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{source.name}</h3 >
              <button 
                className="text-blue-500 hover:underline"
                onClick={() => toggleSectorExpansion(source.name)} // Toggle sector expansion
              >
                {expandedSectors[source.name] ? 'Voir moins' : 'Voir plus'}
              </button>
            </div>
            <div className="mt-2">
              <p>{source.entries} entreprises</p>
              <p>Complétude: {source.completeness}%</p>
            </div>
            {expandedSectors[source.name] && (
              <div className="mt-4">
                <h4 className="font-semibold">Secteurs principaux:</h4>
                <ul className="list-disc pl-5">
                  {source.mainSectors.map((sector) => (
                    <li key={sector.name} className="flex justify-between">
                      <span>{sector.name}</span>
                      <span>{sector.count} entreprises</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        ))}
    </div>
  </div>
);
}

export default SourceComparison;