
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const data = [
  { pays: 'Nigeria', entreprises: 68, investments: 120 },
  { pays: 'Kenya', entreprises: 45, investments: 85 },
  { pays: 'Afrique du Sud', entreprises: 42, investments: 95 },
  { pays: "Côte d'Ivoire", entreprises: 28, investments: 45 },
  { pays: 'Ghana', entreprises: 26, investments: 40 },
  { pays: 'Egypte', entreprises: 24, investments: 55 },
  { pays: 'Rwanda', entreprises: 15, investments: 25 },
];

// Modern color palette for the charts
const barColors = {
  entreprises: "#2D8B61", // Green from africa.green in tailwind config
  investments: "#9C6B22" // Earth from africa.earth in tailwind config
};

const pieColors = ["#2D8B61", "#56BC82", "#8ED6AF", "#BDECD3", "#DCF1E7"];

export function GeographicDistribution() {
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
                data={data}
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
                  data={[
                    { name: 'Ouest', value: 125 },
                    { name: 'Est', value: 80 },
                    { name: 'Sud', value: 60 },
                    { name: 'Nord', value: 50 },
                    { name: 'Centre', value: 25 },
                  ]}
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
