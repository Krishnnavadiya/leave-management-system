import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function DashboardLayout() {
  const { user, loading } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // If auth is loading, render a full screen spinner
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <svg
          className="animate-spin h-10 w-10 text-primary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <p className="mt-4 text-sm text-muted-foreground font-medium animate-pulse">Loading portal assets...</p>
      </div>
    );
  }

  // Redirect to login if user is not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar for Desktop */}
      <Sidebar className="hidden md:flex flex-shrink-0" />

      {/* Slide-out Sidebar for Mobile */}
      {mobileSidebarOpen ? (
        <div className="fixed inset-0 z-40 md:hidden flex">
          {/* Sidebar Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setMobileSidebarOpen(false)}
          />
          {/* Drawer Menu */}
          <div className="relative flex flex-col w-64 bg-card shadow-xl animate-fadeIn h-full">
            <Sidebar />
          </div>
        </div>
      ) : null}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 w-full min-w-0 overflow-hidden">
        {/* Header */}
        <Header onMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

        {/* Dynamic Nested Route Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
