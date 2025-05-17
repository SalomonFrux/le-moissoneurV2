import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { MobileSidebar } from '@/components/MobileSidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [activePage, setActivePage] = useState('dashboard');

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
          {children}
        </div>
      </div>
    </div>
  );
} 