import
 React from 'react';
import { Home, Code, Database, BarChart3, Settings } from 'lucide-react';
interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}