import React from 'react';
import { LayoutDashboard, Users, BarChart3, Home, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

type CRMView = 'dashboard' | 'leads' | 'analytics' | 'settings';

interface CRMSidebarProps {
  activeView: CRMView;
  onViewChange: (view: CRMView) => void;
}

const CRMSidebar: React.FC<CRMSidebarProps> = ({ activeView, onViewChange }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard' as CRMView, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads' as CRMView, label: 'Applications', icon: Users },
    { id: 'analytics' as CRMView, label: 'Analytics', icon: BarChart3 },
    { id: 'settings' as CRMView, label: 'Settings', icon: Settings },
  ];

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'A';
  const userName = user?.email?.split('@')[0] || 'Admin';

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground min-h-screen hidden lg:flex lg:flex-col">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center shadow-lg">
            <span className="text-lg font-bold text-sidebar-primary-foreground">E</span>
          </div>
          <div>
            <h2 className="text-lg font-serif font-bold text-sidebar-foreground">Admin CRM</h2>
            <p className="text-xs text-sidebar-foreground/50">Elvis Sells Houses</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <p className="px-4 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-3">
          Main Menu
        </p>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 mb-1',
              activeView === item.id
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
            {item.id === 'leads' && (
              <span className={cn(
                "ml-auto text-xs px-2 py-0.5 rounded-full",
                activeView === item.id 
                  ? "bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground" 
                  : "bg-sidebar-accent text-sidebar-foreground/70"
              )}>
                All
              </span>
            )}
          </button>
        ))}

        <div className="my-6 border-t border-sidebar-border" />

        <p className="px-4 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-3">
          Quick Actions
        </p>
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200"
        >
          <Home className="w-5 h-5" />
          Back to Website
        </button>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
          <div className="w-9 h-9 rounded-full bg-sidebar-primary flex items-center justify-center">
            <span className="text-sm font-bold text-sidebar-primary-foreground">{userInitial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-sidebar-foreground/50">Administrator</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
        </div>
      </div>
    </aside>
  );
};

export default CRMSidebar;