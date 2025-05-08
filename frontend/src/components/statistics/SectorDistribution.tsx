
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const data = [
  { name: 'Fintech', value: 45, color: '#15616D' },  // Caribbean Current
  { name: 'E-commerce', value: 35, color: '#FF7D00' }, // Orange Wheel
  { name: 'Edtech', value: 28, color: '#78290F' },  // Sienna
  { name: 'Agritech', value: 25, color: '#001524' }, // Rich Black
  { name: 'Santé', value: 18, color: '#FFECD1' },   // Papaya Whip
  { name: 'Autres', value: 29, color: '#A83E32' },  // Mix of Sienna and Orange
];

// Custom colors for the Fintech subsectors
const fintechColors = {
  primary: '#15616D',
  lighter1: '#1D7D8C',
  lighter2: '#2596A6',
  lighter3: '#2DAFC1',
  lighter4: '#4CBECF',
};

export function SectorDistribution() {
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
                  data={data}
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
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Paiements mobiles
                </p>
              </div>
              <div className="font-medium">18 entreprises</div>
            </div>
            <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
              <div className="h-full" style={{ width: '75%', backgroundColor: fintechColors.primary }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Transfert d'argent
                </p>
              </div>
              <div className="font-medium">12 entreprises</div>
            </div>
            <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
              <div className="h-full" style={{ width: '50%', backgroundColor: fintechColors.lighter1 }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Crédit digital
                </p>
              </div>
              <div className="font-medium">9 entreprises</div>
            </div>
            <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
              <div className="h-full" style={{ width: '35%', backgroundColor: fintechColors.lighter2 }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Assurtech
                </p>
              </div>
              <div className="font-medium">6 entreprises</div>
            </div>
            <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
              <div className="h-full" style={{ width: '25%', backgroundColor: fintechColors.lighter3 }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Crypto-monnaie
                </p>
              </div>
              <div className="font-medium">4 entreprises</div>
            </div>
            <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
              <div className="h-full" style={{ width: '15%', backgroundColor: fintechColors.lighter4 }}></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
