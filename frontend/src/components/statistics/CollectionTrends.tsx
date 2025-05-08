import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { fetchCollectionTrends, fetchEnrichmentRates } from '../../../../src/services/dataService';

export function CollectionTrends() {
  const [trendData, setTrendData] = useState([]);
  const [enrichmentData, setEnrichmentData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [trends, enrichment] = await Promise.all([
          fetchCollectionTrends(),
          fetchEnrichmentRates()
        ]);
        setTrendData(trends);
        setEnrichmentData(enrichment);
      } catch (e) {
        setTrendData([]);
        setEnrichmentData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const chartConfig = {
    total: {
      label: 'Total',
      theme: { light: '#000000', dark: '#000000' },
    },
    nouveaux: {
      label: 'Nouveaux',
      theme: { light: '#555555', dark: '#555555' },
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Évolution temporelle de la collecte</CardTitle>
          <CardDescription>Croissance mensuelle du nombre d'entreprises collectées</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={loading ? [] : trendData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="entreprises" 
                    name="total" 
                    stroke="var(--color-total)"
                    strokeWidth={2} 
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="nouveaux" 
                    name="nouveaux" 
                    stroke="var(--color-nouveaux)" 
                    strokeWidth={2} 
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Taux d'enrichissement mensuel</CardTitle>
          <CardDescription>Pourcentage de données enrichies par mois</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={loading ? [] : enrichmentData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis unit="%" />
                <Tooltip formatter={(value) => [`${value}%`, 'Taux d\'enrichissement']} />
                <Legend />
                <Bar dataKey="taux" fill="#000000" name="Taux d'enrichissement" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
