import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { dataService } from '@/services/dataService';
import { toast } from 'sonner';

interface CountryData {
  name: string;
  count: number;
  percentage: number;
}

export function GeographicDistribution() {
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGeographicData() {
      try {
        const data = await dataService.fetchAllScrapedData();
        
        // Count entries by country
        const countryCounts = data.reduce((acc, entry) => {
          const country = entry.pays === 'Aucune donnée' ? 'Non spécifié' : (entry.pays || 'Non spécifié');
          acc[country] = (acc[country] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Convert to array and calculate percentages
        const total = Object.values(countryCounts).reduce((sum, count) => sum + count, 0);
        const countryArray = Object.entries(countryCounts)
          .map(([name, count]) => ({
            name,
            count,
            percentage: (count / total) * 100
          }))
          .sort((a, b) => b.count - a.count);

        setCountries(countryArray);
      } catch (error) {
        console.error('Error fetching geographic data:', error);
        toast.error('Erreur lors du chargement des données géographiques');
      } finally {
        setLoading(false);
      }
    }
    fetchGeographicData();
  }, []);

  if (loading) {
    return <div>Chargement des données géographiques...</div>;
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Distribution Géographique</h3>
      <div className="space-y-4">
        {countries.map((country) => (
          <div key={country.name} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{country.name}</span>
              <span className="font-medium">{country.count}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary rounded-full h-2"
                style={{ width: `${country.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
