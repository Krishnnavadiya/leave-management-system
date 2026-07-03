import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Sun, Moon, Menu, Bell } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const location = useLocation();

  // Create human-readable title based on location pathname
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/apply')) return 'Apply for Leave';
    if (path.includes('/history')) return 'Leave Request History';
    if (path.includes('/profile')) return 'Employee Profile';
    if (path.includes('/approvals')) return 'Pending Approvals Review';
    if (path.includes('/details')) return 'Request Details';
    return 'LeaveFlow Portal';
  };

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b bg-card text-card-foreground">
      {/* Mobile Toggle & Title */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuToggle}
          className="p-1.5 rounded-lg border hover:bg-secondary md:hidden focus:outline-none"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-850 dark:text-white">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Utilities */}
      <div className="flex items-center space-x-3">
        {/* Department Badge */}
        <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
          {user?.department}
        </span>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-150 focus:outline-none"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-yellow-400" /> : <Moon className="h-4.5 w-4.5" />}
        </button>

        {/* Notification Icon (Simulated) */}
        <div className="relative">
          <button
            className="p-2 rounded-lg border hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-150 focus:outline-none"
            title="Notifications"
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
