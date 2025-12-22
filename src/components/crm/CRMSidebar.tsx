import React from 'react';
import { LayoutDashboard, Users, BarChart3, MessageSquare, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

type CRMView = 'dashboard' | 'leads' | 'analytics' | 'messages';

interface CRMSidebarProps {
  activeView: CRMView;
  onViewChange: (view: CRMView) => void;
}

const CRMSidebar: React.FC<CRMSidebarProps> = ({ activeView, onViewChange }) => {
  const menuItems = [
    { id: 'dashboard' as CRMView, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads' as CRMView, label: 'Leads', icon: Users },
    { id: 'analytics' as CRMView, label: 'Analytics', icon: BarChart3 },
    { id: 'messages' as CRMView, label: 'Messages', icon: MessageSquare },
  ];

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground min-h-[calc(100vh-4rem)] hidden lg:block">
      <div className="p-6">
        <h2 className="text-xl font-serif font-bold text-sidebar-foreground">Admin CRM</h2>
        <p className="text-sm text-sidebar-foreground/60 mt-1">Manage your leads</p>
      </div>
      
      <nav className="px-3">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors mb-1',
              activeView === item.id
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="absolute bottom-0 left-0 w-64 p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center">
            <span className="text-xs font-bold text-sidebar-primary-foreground">E</span>
          </div>
          <div>
            <p className="text-sm font-medium">Elvis</p>
            <p className="text-xs text-sidebar-foreground/60">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default CRMSidebar;
