import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { dataService } from '@/services/dataService';
import { toast } from 'sonner';

interface TrendData {
  date: string;
  count: number;
  cumulative: number;
}

export function CollectionTrends() {
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrendData() {
      try {
        const data = await dataService.fetchAllScrapedData();
        
        // Group entries by date
        const dateGroups = data.reduce((acc, entry) => {
          const date = new Date(entry.created_at).toISOString().split('T')[0];
          if (!acc[date]) {
            acc[date] = 0;
          }
          acc[date]++;
          return acc;
        }, {} as Record<string, number>);

        // Convert to array and sort by date
        let cumulative = 0;
        const trendArray = Object.entries(dateGroups)
          .map(([date, count]) => {
            cumulative += count;
            return {
              date,
              count,
              cumulative
            };
          })
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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

  if (loading) {
    return <div>Chargement des tendances...</div>;
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Tendances de Collecte</h3>
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium mb-2">Collecte Quotidienne</h4>
          <div className="h-40 w-full">
            {trends.map((point, index) => (
              <div
                key={point.date}
                className="inline-block w-2 bg-primary mx-0.5"
                style={{
                  height: `${(point.count / Math.max(...trends.map(t => t.count))) * 100}%`,
                  marginTop: 'auto'
                }}
                title={`${point.date}: ${point.count} entreprises`}
              />
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-2">Cumul Total</h4>
          <div className="h-40 w-full">
            <div className="relative h-full">
              {trends.map((point, index) => {
                const previousPoint = index > 0 ? trends[index - 1] : null;
                const x1 = (index / trends.length) * 100;
                const x2 = ((index + 1) / trends.length) * 100;
                const y1 = previousPoint 
                  ? 100 - ((previousPoint.cumulative / trends[trends.length - 1].cumulative) * 100)
                  : 100;
                const y2 = 100 - ((point.cumulative / trends[trends.length - 1].cumulative) * 100);

                return (
                  <svg
                    key={point.date}
                    className="absolute inset-0"
                    preserveAspectRatio="none"
                    viewBox="0 0 100 100"
                  >
                    <line
                      x1={`${x1}%`}
                      y1={`${y1}%`}
                      x2={`${x2}%`}
                      y2={`${y2}%`}
                      stroke="hsl(var(--primary))"
                      strokeWidth="2"
                    />
                  </svg>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
