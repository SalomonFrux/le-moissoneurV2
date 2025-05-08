
// import React from 'react';
// import { 
//   Home, 
//   Database, 
//   Code, 
//   Settings, 
//   Layers, 
//   BarChart3, 
//   TrendingUp 
// } from 'lucide-react';
// import { cn } from '@/lib/utils';

// interface SidebarItemProps {
//   icon: React.ElementType;
//   label: string;
//   active?: boolean;
//   onClick?: () => void;
// }

// function SidebarItem({ icon: Icon, label, active, onClick }: SidebarItemProps) {
//   return (
//     <button
//       className={cn(
//         "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
//         active 
//           ? "bg-africa-green-500 text-white" 
//           : "text-sidebar-foreground hover:bg-africa-green-400/20"
//       )}
//       onClick={onClick}
//     >
//       <Icon className="h-5 w-5" />
//       <span>{label}</span>
//     </button>
//   );
// }

// interface SidebarProps {
//   activePage: string;
//   setActivePage: (page: string) => void;
// }

// export function Sidebar({ activePage, setActivePage }: SidebarProps) {
//   const navigation = [
//     { name: 'Tableau de bord', icon: Home, id: 'dashboard' },
//     { name: 'Scrapers', icon: Code, id: 'scrapers' },
//     { name: 'Données', icon: Database, id: 'data' },
//     { name: 'Enrichissement', icon: Layers, id: 'enrichment' },
//     { name: 'Statistiques', icon: BarChart3, id: 'statistics' },
//     { name: 'Performance', icon: TrendingUp, id: 'performance' },
//     { name: 'Paramètres', icon: Settings, id: 'settings' },
//   ];

//   return (
//     <aside className="bg-sidebar flex-shrink-0 w-64 border-r border-africa-green-900/10 hidden md:block">
//       <div className="flex flex-col h-full">
//         <div className="px-4 py-6">
//           <div className="flex items-center">
//             <div className="w-8 h-8 rounded-full bg-africa-green-500 flex items-center justify-center mr-3">
//               <span className="text-white font-bold">AS</span>
//             </div>
//             <h2 className="font-heading font-bold text-xl">Afric-Scraper</h2>
//           </div>
//         </div>
//         <nav className="flex-1 px-4 space-y-1 mt-4">
//           {navigation.map((item) => (
//             <SidebarItem
//               key={item.id}
//               icon={item.icon}
//               label={item.name}
//               active={activePage === item.id}
//               onClick={() => setActivePage(item.id)}
//             />
//           ))}
//         </nav>
//         <div className="px-4 py-4 border-t border-africa-green-900/10">
//           <div className="flex items-center">
//             <div className="w-8 h-8 rounded-full bg-africa-earth-400 flex items-center justify-center mr-2">
//               <span className="text-white font-medium text-sm">AF</span>
//             </div>
//             <div className="flex-1">
//               <p className="text-sm font-medium">Afric Developer</p>
//               <p className="text-xs text-sidebar-foreground/70">dev@afric-scraper.com</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </aside>
//   );
// }


import React from 'react';
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
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        active 
          ? "bg-white/20 text-white backdrop-blur-sm" 
          : "text-sidebar-foreground hover:bg-white/10"
      )}
      onClick={onClick}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </button>
  );
}

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

export function Sidebar({ activePage, setActivePage }: SidebarProps) {
  const navigation = [
    { name: 'Tableau de bord', icon: Home, id: 'dashboard' },
    { name: 'Scrapers', icon: Code, id: 'scrapers' },
    { name: 'Données', icon: Database, id: 'data' },
    { name: 'Enrichissement', icon: Layers, id: 'enrichment' },
    { name: 'Statistiques', icon: BarChart3, id: 'statistics' },
    { name: 'Performance', icon: TrendingUp, id: 'performance' },
    { name: 'Paramètres', icon: Settings, id: 'settings' },
  ];

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
              key={item.id}
              icon={item.icon}
              label={item.name}
              active={activePage === item.id}
              onClick={() => setActivePage(item.id)}
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
