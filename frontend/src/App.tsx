import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Pages
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import ApplyLeave from './pages/ApplyLeave';
import LeaveHistory from './pages/LeaveHistory';
import LeaveDetails from './pages/LeaveDetails';
import EmployeeProfile from './pages/EmployeeProfile';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Helper component to redirect root "/" to the appropriate dashboard
function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'MANAGER') return <Navigate to="/manager/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Protected App Shell Layout */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                {/* Root router path switcher */}
                <Route index element={<RootRedirect />} />

                {/* Employee only routes */}
                <Route
                  path="dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                      <EmployeeDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="apply"
                  element={
                    <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                      <ApplyLeave />
                    </ProtectedRoute>
                  }
                />

                {/* Manager only routes */}
                <Route
                  path="manager/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['MANAGER']}>
                      <ManagerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="manager/approvals"
                  element={
                    <ProtectedRoute allowedRoles={['MANAGER']}>
                      <ManagerDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Shared protected routes */}
                <Route path="history" element={<LeaveHistory />} />
                <Route path="details/:id" element={<LeaveDetails />} />
                <Route path="profile" element={<EmployeeProfile />} />

                {/* Catch-all 404 inside Portal */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
