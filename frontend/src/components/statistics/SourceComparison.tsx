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
  const [expanded, setExpanded] = useState(false); // State to track if cards are expanded

  useEffect(() => {
    async function fetchSourceData() {
      try {
        const data = await dataService.fetchAllScrapedData();
        
        // Process source data
        const sourceData = await Promise.all(data.map(async (group) => {
          const sourceId = group.entries[0].scraper_id || 'Source inconnue';
          
          // Fetch the scraper name using the sourceId
          const scraper = await dataService.fetchScraperById(sourceId); // Assuming this function exists
          const sourceName = scraper ? scraper.name : 'Source inconnue'; // Use the fetched name or default

          const acc = {
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

          group.entries.forEach(entry => {
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
        }));

        // Convert to array and calculate averages
        const sourceArray = sourceData.map(source => ({
          ...source,
          completeness: Math.round(source.completeness / source.entries),
          mainSectors: Object.entries(source.mainSectors)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3), // Keep only the top 3 sectors
          quality: {
            email: (source.quality.email / source.entries) * 100,
            phone: (source.quality.phone / source.entries) * 100,
            address: (source.quality.address / source.entries) * 100,
            website: (source.quality.website / source.entries) * 100
          }
        })).sort((a, b) => b.entries - a.entries);

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
              <Bar dataKey="entries" name="Entreprises" fill="#15616D" />
              <Bar dataKey="completeness" name="Complétude (%)" fill="#FF7D00" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 h-40 overflow-hidden transition-all duration-300 ease-in-out" style={{ height: expanded ? 'auto' : '50%' }}>
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
                <Bar dataKey="quality.email" name="Emails" fill="#15616D" />
                <Bar dataKey="quality.phone" name="Téléphones" fill="#FF7D00" />
                <Bar dataKey="quality.address" name="Adresses" fill="#78290F" />
                <Bar dataKey="quality.website" name="Sites web" fill="#001524" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 h-40 overflow-hidden transition-all duration-300 ease-in-out" style={{ height: expanded ? 'auto' : '50%' }}>
          <h3 className="text-lg font-semibold mb-4">Secteurs principaux par source</h3>
          <div className="space-y-6">
            {sources.map((source) => (
              <div key={source.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: "#15616D" }} // Consistent color
                      />
                      <span className="font-medium">{source.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {source.entries} entreprises
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  {source.mainSectors.slice(0, 5).map((sector) => ( // Limit to top 5 sectors
                    <div key={sector.name} className="flex justify-between text-sm">
                      <span>{sector.name}</span>
                      <span className="font-medium">{sector.count} entreprises</span>
                    </div>
                  ))}
                </div>
                <button 
                  className="mt-2 text-blue-500 hover:underline"
                  onClick={() => setExpanded(!expanded)} // Toggle expanded state
                >
                  {expanded ? 'Voir moins' : 'Voir plus'}
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default SourceComparison;