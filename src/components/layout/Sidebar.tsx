import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  Home,
  ShoppingCart,
  Building2,
  Info,
  LayoutDashboard,
  MessageSquare,
  LogIn,
  UserPlus,
  Moon,
  Sun,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const publicLinks = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/buy', icon: ShoppingCart, label: 'Buy a Home' },
    { to: '/sell', icon: Building2, label: 'Sell Your House' },
    { to: '/about', icon: Info, label: 'About Us' },
  ];

  const guestLinks = [
    { to: '/dashboard', icon: MessageSquare, label: 'My Dashboard' },
  ];

  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Admin CRM' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-sidebar text-sidebar-foreground shadow-lg md:hidden"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-30 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-sidebar text-sidebar-foreground z-40 transition-transform duration-300 ease-in-out flex flex-col',
          'w-64 md:w-56 lg:w-64',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <Link to="/" className="block" onClick={() => onToggle()}>
            <h1 className="font-serif text-xl font-bold tracking-tight text-sidebar-foreground">
              ELVIS<span className="text-sidebar-primary"> SELLS</span>
            </h1>
            <p className="font-serif text-lg text-sidebar-primary font-semibold -mt-1">
              HOUSES
            </p>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
          {/* Public Links */}
          <div className="space-y-1">
            {publicLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => window.innerWidth < 768 && onToggle()}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                  isActive(link.to)
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <link.icon size={20} />
                <span className="font-medium">{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Authenticated Links */}
          {user && (
            <>
              <div className="my-4 border-t border-sidebar-border" />
              <div className="space-y-1">
                {!isAdmin && guestLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => window.innerWidth < 768 && onToggle()}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                      isActive(link.to)
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )}
                  >
                    <link.icon size={20} />
                    <span className="font-medium">{link.label}</span>
                  </Link>
                ))}
                {isAdmin && adminLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => window.innerWidth < 768 && onToggle()}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                      isActive(link.to)
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )}
                  >
                    <link.icon size={20} />
                    <span className="font-medium">{link.label}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </nav>

        {/* Auth Buttons & Theme Toggle */}
        <div className="p-4 border-t border-sidebar-border space-y-2">
          {!user ? (
            <>
              <Link to="/signup" onClick={() => window.innerWidth < 768 && onToggle()}>
                <Button variant="sidebar" className="w-full justify-start gap-3">
                  <UserPlus size={20} />
                  Sign Up
                </Button>
              </Link>
              <Link to="/signin" onClick={() => window.innerWidth < 768 && onToggle()}>
                <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent">
                  <LogIn size={20} />
                  Sign In
                </Button>
              </Link>
            </>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={signOut}
            >
              <LogOut size={20} />
              Sign Out
            </Button>
          )}

          <div className="pt-2 border-t border-sidebar-border">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={toggleTheme}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
