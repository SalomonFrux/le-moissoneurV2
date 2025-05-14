import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { MobileSidebar } from '@/components/MobileSidebar';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { ScrapersPage } from '@/components/dashboard/ScrapersPage';
import { DataPage } from '@/components/dashboard/DataPage';
import { StatisticsPage } from '@/components/statistics/StatisticsPage';
import { ParametersPage } from '@/components/settings/ParametersPage';

import axios from 'axios';
import { dataService } from '@/services/dataService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface DashboardData {
  totalScrapers: number;
  totalData: number;
  recentData: any[];
  activeScrapers: any[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

const Index = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(4);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      // First get all scrapers
      const scrapers = await dataService.getAllScrapers();
      const activeScrapers = scrapers.filter(s => s.status === 'running');
      
      // Get all scraped data
      const scrapedData = await dataService.fetchAllScrapedData();
      
      // Calculate pagination
      const totalPages = Math.ceil(scrapedData.length / pageSize);
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedData = scrapedData.slice(start, end);

      setDashboardData({
        totalScrapers: scrapers.length,
        totalData: scrapedData.length,
        recentData: paginatedData,
        activeScrapers,
        pagination: {
          page,
          pageSize,
          totalPages
        }
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [page, pageSize]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center h-16 md:h-16 px-4 border-b md:px-6 bg-primary">
        <MobileSidebar activePage={activePage} setActivePage={setActivePage} />
        <div className="ml-auto flex items-center gap-4">
          <h1 className="text-xl font-bold text-white">SamExtract</h1>
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
              <Dashboard data={dashboardData} />
            )
          )}
          {activePage === 'scrapers' && <ScrapersPage />}
          {activePage === 'data' && <DataPage />}
          {activePage === 'statistics' && <StatisticsPage />}
          {activePage === 'settings' && <ParametersPage />}
        </div>
      </div>
    </div>
  );
}

export default Index;
