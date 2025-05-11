import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { dataService } from '@/services/dataService';
import { toast } from 'sonner';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TrendData {
  date: string;
  total: number;
  new: number;
  enrichmentRate: number;
}

export function CollectionTrends() {
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrendData() {
      try {
        const data = await dataService.fetchAllScrapedData();
        
        // Group entries by month
        const monthlyData = data.reduce((acc, entry) => {
          const date = new Date(entry.created_at);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!acc[monthKey]) {
            acc[monthKey] = {
              date: monthKey,
              total: 0,
              new: 0,
              enrichmentRate: 0
            };
          }
          
          acc[monthKey].total++;
          acc[monthKey].new++;
          
          return acc;
        }, {} as Record<string, TrendData>);

        // Convert to array and sort by date
        let trendArray = Object.values(monthlyData)
          .sort((a, b) => a.date.localeCompare(b.date));

        // Calculate cumulative totals and enrichment rates
        let runningTotal = 0;
        trendArray = trendArray.map(month => {
          runningTotal += month.new;
          return {
            ...month,
            total: runningTotal,
            enrichmentRate: (month.new / runningTotal) * 100
          };
        });

        setTrends(trendArray);
      } catch (error) {
        console.error('Error fetching trend data:', error);
        toast.error('Erreur lors du chargement des tendances');
      } finally {
        setLoading(false);
      }
    }
    fetchTrendData();
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="font-medium">{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} style={{ color: p.color }}>
              {p.name === 'total' ? 'Total: ' : p.name === 'new' ? 'Nouvelles: ' : 'Taux: '}
              {p.value} {p.name === 'enrichmentRate' ? '%' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div>Chargement des tendances...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Évolution temporelle de la collecte</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trends}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="total" 
                name="Total entreprises"
                stroke="#000000" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="new" 
                name="Nouvelles entreprises"
                stroke="#555555" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Taux d'enrichissement mensuel</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={trends}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="enrichmentRate" 
                name="Taux d'enrichissement"
                fill="#000000"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
