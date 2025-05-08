import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { fetchGeographicDistribution, fetchRegionalDistribution } from '../../../../src/services/dataService';

export function GeographicDistribution() {
  const [data, setData] = useState([]);
  const [regionData, setRegionData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [geo, region] = await Promise.all([
          fetchGeographicDistribution(),
          fetchRegionalDistribution()
        ]);
        setData(geo);
        setRegionData(region);
      } catch {
        setData([]);
        setRegionData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const barColors = {
    entreprises: "#2D8B61",
    investments: "#9C6B22"
  };

  const pieColors = ["#2D8B61", "#56BC82", "#8ED6AF", "#BDECD3", "#DCF1E7"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Répartition géographique des entreprises</CardTitle>
          <CardDescription>Par pays, en nombre d'entreprises et investissements (M$)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={loading ? [] : data}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E3D0AE" />
                <XAxis dataKey="pays" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "rgba(255,255,255,0.9)", 
                    borderRadius: "8px", 
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)" 
                  }}
                />
                <Legend />
                <Bar dataKey="entreprises" fill={barColors.entreprises} name="Entreprises" />
                <Bar dataKey="investments" fill={barColors.investments} name="Investissements (M$)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Répartition régionale</CardTitle>
          <CardDescription>Par région africaine</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart width={400} height={400}>
                <Pie
                  data={loading ? [] : regionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  dataKey="value"
                >
                  {pieColors.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} entreprises`, 'Nombre']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
