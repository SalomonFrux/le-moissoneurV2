import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { MobileSidebar } from '@/components/MobileSidebar';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { ScrapersPage } from '@/components/dashboard/ScrapersPage';
import { DataPage } from '@/components/dashboard/DataPage';
import { StatisticsPage } from '@/components/statistics/StatisticsPage';
import { ParametersPage } from '@/components/settings/ParametersPage';
import { EnrichmentPage } from '@/components/enrichment/EnrichmentPage';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const Index = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/api/dashboard`, {
        params: {
          page,
          pageSize,
        }
      });
      // Handle response data
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [page]);

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
          {activePage === 'dashboard' && (
            isLoading ? (
              <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
              </div>
            ) : (
              <Dashboard />
            )
          )}
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
