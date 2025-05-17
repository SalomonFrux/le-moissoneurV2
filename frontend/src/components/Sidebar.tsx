import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Database, 
  Code, 
  Settings, 
  Layers, 
  BarChart3, 
  TrendingUp 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function SidebarItem({ icon: Icon, label, active, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors',
        active
          ? 'bg-white/10 text-white'
          : 'text-white/70 hover:bg-white/10 hover:text-white'
      )}
    >
      <Icon className="w-5 h-5 mr-3" />
      {label}
    </button>
  );
}

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

export function Sidebar({ activePage, setActivePage }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    { name: 'Tableau de bord', icon: Home, path: '/dashboard' },
    { name: 'Scrapers', icon: Code, path: '/scrapers' },
    { name: 'Données', icon: Database, path: '/data' },
    { name: 'Statistiques', icon: BarChart3, path: '/statistics' },
    { name: 'Paramètres', icon: Settings, path: '/settings' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setActivePage(path.split('/')[1] || 'dashboard');
  };

  return (
    <aside className="bg-sidebar/90 backdrop-blur-md flex-shrink-0 w-64 border-r border-sidebar-border/30 hidden md:block">
      <div className="flex flex-col h-full">
        <div className="px-4 py-6">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent/80 to-primary/80 flex items-center justify-center mr-3 shadow-md">
              <span className="text-white font-bold">SE</span>
            </div>
            <h2 className="font-heading font-bold text-xl bg-gradient-to-b from-white to-white/80 bg-clip-text text-transparent">SamExtract</h2>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navigation.map((item) => (
            <SidebarItem
              key={item.path}
              icon={item.icon}
              label={item.name}
              active={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
            />
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-sidebar-border/30">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-2">
              <span className="text-white font-medium text-sm">SE</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">SamExtract</p>
              <p className="text-xs text-sidebar-foreground/70">dev@SamExtract.com</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
