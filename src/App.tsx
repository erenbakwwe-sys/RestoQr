import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import Onboarding from './pages/Onboarding';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Orders from './pages/admin/Orders';
import MenuManagement from './pages/admin/MenuManagement';
import QRCodes from './pages/admin/QRCodes';
import WaiterCalls from './pages/admin/WaiterCalls';
import Finance from './pages/admin/Finance';
import ThemeSettings from './pages/admin/ThemeSettings';
import CustomerMenu from './pages/CustomerMenu';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/" />;
  return <>{children}</>;
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            
            <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="orders" element={<Orders />} />
              <Route path="menu" element={<MenuManagement />} />
              <Route path="qr" element={<QRCodes />} />
              <Route path="calls" element={<WaiterCalls />} />
              <Route path="finance" element={<Finance />} />
              <Route path="theme" element={<ThemeSettings />} />
            </Route>

            <Route path="/menu/:restaurantId/:tableNumber" element={<CustomerMenu />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
