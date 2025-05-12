import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { MobileSidebar } from '@/components/MobileSidebar';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { ScrapersPage } from '@/components/dashboard/ScrapersPage';
import { DataPage } from '@/components/dashboard/DataPage';
import { StatisticsPage } from '@/components/statistics/StatisticsPage';
import { ParametersPage } from '@/components/settings/ParametersPage';
import { EnrichmentPage } from '@/components/enrichment/EnrichmentPage';

const Index = () => {
  const [activePage, setActivePage] = useState('dashboard');

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center h-16 md:h-16 px-4 border-b md:px-6 bg-primary">
        <MobileSidebar activePage={activePage} setActivePage={setActivePage} />
        <div className="ml-auto flex items-center gap-4">
          <h1 className="text-xl font-bold text-white">SamExtract
          </h1>
        </div>
      </div>
      <div className="flex-1 flex">
        <Sidebar activePage={activePage} setActivePage={setActivePage} />
        <div className="flex-1 overflow-auto">
          {activePage === 'dashboard' && <Dashboard />}
          {activePage === 'scrapers' && <ScrapersPage />}
          {activePage === 'data' && <DataPage />}
          {activePage === 'statistics' && <StatisticsPage />}
          {activePage === 'settings' && <ParametersPage />}
          {activePage === 'enrichment' && <EnrichmentPage />}
          {activePage === 'performance' && (
            <div className="p-6">
              <h2 className="text-3xl font-bold font-heading tracking-tight">Performance</h2>
              <p className="mt-2 text-muted-foreground">
                Cette fonctionnalité sera disponible prochainement.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Index;
