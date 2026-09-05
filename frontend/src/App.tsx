import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { RoleSelectPage } from './pages/public/RoleSelectPage';
import { LoginPage } from './pages/public/LoginPage';
import { SignupPage } from './pages/public/SignupPage';

// Farmer Pages
import { FarmerDashboard } from './pages/farmer/FarmerDashboard';
import { MyProducePage } from './pages/farmer/MyProducePage';
import { ListProducePage } from './pages/farmer/ListProducePage';
import { MarketPricesPage } from './pages/farmer/MarketPricesPage';
import { BuyerRequirementsPage } from './pages/farmer/BuyerRequirementsPage';
import { BuyerRequestsPage } from './pages/farmer/BuyerRequestsPage';
import { FarmerOrdersPage } from './pages/farmer/FarmerOrdersPage';
import { FarmerProfilePage } from './pages/farmer/FarmerProfilePage';

// Buyer Pages
import { BuyerDashboard } from './pages/buyer/BuyerDashboard';
import { MarketplacePage } from './pages/buyer/MarketplacePage';
import { ProduceDetailPage } from './pages/buyer/ProduceDetailPage';
import { MyRequirementsPage } from './pages/buyer/MyRequirementsPage';
import { CreateRequirementPage } from './pages/buyer/CreateRequirementPage';
import { BuyerOrdersPage } from './pages/buyer/BuyerOrdersPage';
import { BuyerProfilePage } from './pages/buyer/BuyerProfilePage';

// Transport Route Optimizer
import { SmartTransportPage } from './pages/transport/SmartTransportPage';

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/roles" element={<RoleSelectPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Farmer Experience (Authentication Required) */}
      <Route 
        path="/farmer" 
        element={
          <ProtectedRoute requiredRole="farmer">
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/farmer/dashboard" replace />} />
        <Route path="dashboard" element={<FarmerDashboard />} />
        <Route path="produce" element={<MyProducePage />} />
        <Route path="produce/new" element={<ListProducePage />} />
        <Route path="market-prices" element={<MarketPricesPage />} />
        <Route path="requirements" element={<BuyerRequirementsPage />} />
        <Route path="requests" element={<BuyerRequestsPage />} />
        <Route path="orders" element={<FarmerOrdersPage />} />
        <Route path="transport" element={<SmartTransportPage />} />
        <Route path="profile" element={<FarmerProfilePage />} />
      </Route>

      {/* Buyer Experience (Authentication Required) */}
      <Route 
        path="/buyer" 
        element={
          <ProtectedRoute requiredRole="buyer">
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/buyer/dashboard" replace />} />
        <Route path="dashboard" element={<BuyerDashboard />} />
        <Route path="marketplace" element={<MarketplacePage />} />
        <Route path="produce/:id" element={<ProduceDetailPage />} />
        <Route path="requirements" element={<MyRequirementsPage />} />
        <Route path="requirements/new" element={<CreateRequirementPage />} />
        <Route path="orders" element={<BuyerOrdersPage />} />
        <Route path="transport" element={<SmartTransportPage />} />
        <Route path="profile" element={<BuyerProfilePage />} />
      </Route>

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
export default App;
