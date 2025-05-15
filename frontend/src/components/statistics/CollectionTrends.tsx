import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { dataService } from '@/services/dataService';
import { toast } from 'sonner';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TrendData {
  date: string;
  total: number;
  new: number;
  enrichmentRate: number;
  completeness: number;
}

export function CollectionTrends() {
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0); // For manual refresh
  const [showMetrics, setShowMetrics] = useState(false); // Track the visibility of metrics

  // Manual refresh handler
  const handleRefresh = () => setReloadKey(k => k + 1);

  useEffect(() => {
    async function fetchTrendData() {
      try {
        const data = await dataService.fetchAllScrapedData();
        const allEntries = data.flatMap(group => group.entries);
        let loaded = 0, skipped = 0;

        // Defensive: filter out entries with missing or invalid created_at, fallback to now
        const validEntries = allEntries.map(entry => {
          let date = entry.created_at ? new Date(entry.created_at) : new Date();
          if (isNaN(date.getTime())) {
            skipped++;
            return null;
          }
          loaded++;
          return { ...entry, created_at: date.toISOString() };
        }).filter(Boolean);

        if (validEntries.length === 0) {
          setTrends([]);
          return;
        }

        // Group entries by month
        const todayKey = (() => {
          const now = new Date();
          return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        })();
        const monthlyData = validEntries.reduce((acc, entry: any) => {
          const date = new Date(entry.created_at);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          if (!acc[monthKey]) {
            acc[monthKey] = {
              date: monthKey,
              new: 0,
              newToday: 0,
              completeness: 0
            };
          }
          acc[monthKey].new++;
          // If this entry is from today, increment newToday
          if (dayKey === todayKey) {
            acc[monthKey].newToday = (acc[monthKey].newToday || 0) + 1;
          }
          // Calculate completeness for this entry
          const fields = ['nom', 'email', 'telephone', 'adresse', 'secteur'];
          const filledFields = fields.filter(field => entry[field] && entry[field] !== 'Aucune donnée').length;
          acc[monthKey].completeness += (filledFields / fields.length) * 100;
          return acc;
        }, {} as Record<string, { date: string; new: number; newToday: number; completeness: number }>);

        // Convert to array and sort by real date
        let trendArray = Object.values(monthlyData)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Calculate cumulative totals and averages
        let runningTotal = 0;
        const fullTrendArray: (TrendData & { newToday?: number })[] = trendArray.map(month => {
          runningTotal += month.new;
          return {
            date: month.date,
            new: month.new,
            newToday: month.newToday,
            total: runningTotal,
            enrichmentRate: (month.new / runningTotal) * 100,
            completeness: month.new > 0 ? month.completeness / month.new : 0 // Avoid division by zero
          };
        });
        setTrends(fullTrendArray);
      } catch (error) {
        console.error('Error fetching trend data:', error);
        toast.error('Erreur lors du chargement des tendances');
      } finally {
        setLoading(false);
      }
    }
    fetchTrendData();
  }, [reloadKey]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="font-medium">{label}</p>
          {payload.map((p: any) => {
            let labelText = '';
            if (p.name === 'total') labelText = 'Total entreprises: ';
            else if (p.name === 'new') labelText = 'Nouvelles entreprises (mois): ';
            else if (p.name === 'newToday') labelText = 'Nouvelles entreprises (aujourd\'hui): ';
            else if (p.name === 'completeness') labelText = 'Complétude: ';
            else if (p.name === 'enrichmentRate') labelText = "Taux d'enrichissement: ";
            else labelText = p.name + ': ';
            const showPercent = p.name === 'completeness' || p.name === 'enrichmentRate';
            return (
              <p key={p.name} style={{ color: p.color }}>
                {labelText}
                {p.value.toFixed(1)}{showPercent ? ' %' : ''}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><div className="loader">Chargement des tendances...</div></div>; // Add a loader
  }

  if (trends.length === 0) {
    return <div>Aucune tendance disponible.</div>; // Handle no data case
  }

  const toggleMetrics = () => {
    setShowMetrics(!showMetrics); // Toggle the visibility of metrics
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold mb-4">Évolution temporelle de la collecte</h3>
        {/* <button onClick={handleRefresh} className="px-3 py-1 rounded bg-primary text-white hover:bg-primary/80 transition">Rafraîchir</button> */}
      </div>
      
      {/* Conditional rendering for Évolution temporelle de la collecte */}
      {!showMetrics && (
        <Card className="p-6">
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
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
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  name="Total entreprises"
                  stroke="#2D8B61" 
                  fillOpacity={0.3}
                  fill="#2D8B61" // Updated color
                />
                <Area 
                  type="monotone" 
                  dataKey="new" 
                  name="Nouvelles entreprises (mois)"
                  stroke="#FF5733" 
                  fillOpacity={0.3}
                  fill="#FF5733" // Updated color
                />
                <Area 
                  type="monotone" 
                  dataKey="newToday" 
                  name="Nouvelles entreprises (aujourd'hui)"
                  stroke="#0077FF" 
                  fillOpacity={0.3}
                  fill="#0077FF" // Blue for today
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Button to toggle Taux d'enrichissement and Complétude */}
      <div className="flex justify-end mb-2">
        <button 
           className="px-4 py-2 border border-grey bg-[#] text-black rounded hover:bg-[#FF6F20] hover:text-white transition flex items-center"
          onClick={toggleMetrics}
        >
          {showMetrics ? 'Cacher Taux d\'enrichissement et Complétude' : 'Voir Taux d\'enrichissement et Complétude'}
        </button>
      </div>

      {/* Conditional rendering for Taux d'enrichissement and Complétude */}
      {showMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Taux d'enrichissement mensuel</h3>
            <div className="h-[300px]">
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
                  <YAxis unit="%" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="enrichmentRate" 
                    name="Taux d'enrichissement"
                    stroke="#2D8B61" // Updated color
                    strokeWidth={2} 
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Complétude des données</h3>
            <div className="h-[300px]">
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
                  <YAxis unit="%" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="completeness" 
                    name="Complétude"
                    stroke="#FF8C00" // Updated color
                    strokeWidth={2} 
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}