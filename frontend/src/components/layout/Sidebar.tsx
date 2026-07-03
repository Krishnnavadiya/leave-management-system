import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CalendarPlus,
  History,
  CheckSquare,
  Users,
  User,
  LogOut,
  CalendarDays
} from 'lucide-react';

export function Sidebar({ className }: { className?: string }) {
  const { user, logout } = useAuth();

  const isManager = user?.role === 'MANAGER';

  const baseLinks = [
    {
      to: isManager ? '/manager/dashboard' : '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/history',
      label: 'Leave History',
      icon: History,
    },
    {
      to: '/profile',
      label: 'Profile',
      icon: User,
    },
  ];

  const employeeLinks = [
    {
      to: '/apply',
      label: 'Apply Leave',
      icon: CalendarPlus,
    },
  ];

  const managerLinks = [
    {
      to: '/manager/approvals',
      label: 'Pending Approvals',
      icon: CheckSquare,
    },
  ];

  const links = [
    ...baseLinks.slice(0, 1),
    ...(isManager ? [] : employeeLinks),
    ...(isManager ? managerLinks : []),
    ...baseLinks.slice(1),
  ];

  return (
    <aside className={`flex flex-col w-64 border-r bg-card text-card-foreground h-full ${className}`}>
      {/* Brand Header */}
      <div className="flex items-center h-16 px-6 border-b">
        <CalendarDays className="h-6 w-6 text-primary mr-2" />
        <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          LeaveFlow
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`
              }
            >
              <Icon className="h-4 w-4 mr-3 flex-shrink-0 group-hover:scale-105 duration-100" />
              {link.label}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer info */}
      <div className="p-4 border-t bg-slate-50/50 dark:bg-slate-900/30">
        <div className="flex items-center space-x-3 mb-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-sm">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-150"
        >
          <LogOut className="h-4 w-4 mr-3" />
          Logout
        </button>
      </div>
    </aside>
  );
}
