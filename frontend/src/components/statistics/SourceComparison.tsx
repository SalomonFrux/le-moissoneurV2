import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { fetchSourceComparison } from '../../../../src/services/dataService';

export function SourceComparison() {
  const [sourceData, setSourceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await fetchSourceComparison();
        setSourceData(data);
      } catch {
        setSourceData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Comparaison des sources de données</CardTitle>
          <CardDescription>Nombre d'entreprises par source et qualité des données</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={loading ? [] : sourceData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="source" type="category" />
                <Tooltip />
                <Legend />
                <Bar dataKey="entreprises" name="Nombre d'entreprises" fill="#000000" />
                <Bar dataKey="complete" name="Complétude des données (%)" fill="#777777" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Répartition des données par source</CardTitle>
          <CardDescription>Proportion des données collectées par source</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={loading ? [] : sourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="entreprises"
                  nameKey="source"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} entreprises`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Qualité des données par source</CardTitle>
          <CardDescription>Évaluation de la qualité et de la complétude des données par source</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {loading ? (
              <div>Chargement...</div>
            ) : sourceData.map((source, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: source.fill }}
                    ></div>
                    <h3 className="font-medium">{source.source}</h3>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {source.entreprises} entreprises - Complétude: {source.complete}%
                  </span>
                </div>
                <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${source.complete}%` }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Secteurs principaux: {source.secteurs.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
