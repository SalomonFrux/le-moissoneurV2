import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { LoginPage } from '@/pages/LoginPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ScrapersPage } from '@/components/dashboard/ScrapersPage';
import { DataPage } from '@/components/dashboard/DataPage';
import { StatisticsPage } from '@/components/statistics/StatisticsPage';
import { ParametersPage } from '@/components/settings/ParametersPage';
import { authService } from '@/services/authService';

function App() {
  useEffect(() => {
    // Initialize authentication state
    authService.initializeAuth();
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/scrapers" element={
          <ProtectedRoute>
            <DashboardLayout>
              <ScrapersPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/data" element={
          <ProtectedRoute>
            <DashboardLayout>
              <DataPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/statistics" element={
          <ProtectedRoute>
            <DashboardLayout>
              <StatisticsPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <DashboardLayout>
              <ParametersPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        
        {/* Redirect root to dashboard if authenticated, otherwise to login */}
        <Route path="/" element={
          authService.isAuthenticated() ? 
            <Navigate to="/dashboard" replace /> : 
            <Navigate to="/login" replace />
        } />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
