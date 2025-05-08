import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { fetchSectorDistribution, fetchFintechSubsectors } from '../../../../src/services/dataService';

export function SectorDistribution() {
  const [data, setData] = useState([]);
  const [fintechData, setFintechData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [sector, fintech] = await Promise.all([
          fetchSectorDistribution(),
          fetchFintechSubsectors()
        ]);
        setData(sector);
        setFintechData(fintech);
      } catch {
        setData([]);
        setFintechData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Répartition par secteur d'activité</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={loading ? [] : data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} entreprises`, 'Nombre']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Top 5 sous-secteurs Fintech</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div>Chargement...</div>
            ) : fintechData.map((item, idx) => (
              <div key={item.name}>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {item.name}
                    </p>
                  </div>
                  <div className="font-medium">{item.value} entreprises</div>
                </div>
                <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
                  <div className="h-full" style={{ width: `${item.percent}%`, backgroundColor: item.color }}></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
