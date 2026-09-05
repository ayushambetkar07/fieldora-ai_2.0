import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Sidebar } from './Sidebar';
import { AIAssistantDrawer } from './AIAssistantDrawer';
import { TickerTape } from './TickerTape';
import { ToastContainer } from '../ui/feedback';
import { 
  Menu, 
  Sparkles, 
  Store, 
  LayoutDashboard, 
  Wheat, 
  ClipboardList, 
  PackageCheck, 
  ArrowLeftRight,
  ShieldCheck,
  Truck
} from 'lucide-react';
import { cn } from '../ui';

export const AppLayout: React.FC = () => {
  const { userRole, setUserRole, toggleAssistant, currentFarmer, currentBuyer } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleRoleToggle = () => {
    const nextRole = userRole === 'farmer' ? 'buyer' : 'farmer';
    setUserRole(nextRole);
    navigate(nextRole === 'farmer' ? '/farmer/dashboard' : '/buyer/dashboard');
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden selection:bg-primary selection:text-white">
      
      {/* Top Live Ticker */}
      <TickerTape />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        
        {/* Desktop Sidebar (Fixed 260px) */}
        <div className="hidden md:flex shrink-0">
          <Sidebar />
        </div>

        {/* Mobile Drawer Backdrop & Sidebar */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-xs" 
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative z-10 w-72 h-full">
              <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          
          {/* Top Header */}
          <header className="h-16 glass-nav px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 border-b border-border">
            
            <div className="flex items-center gap-3">
              {/* Mobile Hamburger */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-button text-secondary hover:text-main hover:bg-[#EAEFEA] transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Portal Badge */}
              <div className="flex items-center gap-2">
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase shadow-2xs border",
                  userRole === 'farmer' 
                    ? "bg-amber-100/90 text-amber-900 border-amber-300"
                    : "bg-emerald-100/90 text-emerald-900 border-emerald-300"
                )}>
                  <span className={cn("live-dot mr-0.5", userRole === 'farmer' ? "bg-amber-500" : "bg-emerald-500")} />
                  {userRole === 'farmer' ? '🌾 Farmer / Producer Portal' : '🏢 Institutional Buyer Portal'}
                </span>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Direct Smart Transport Button */}
              <Link
                to={userRole === 'farmer' ? '/farmer/transport' : '/buyer/transport'}
                className="px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all bg-[#166534] hover:bg-[#14532d] text-white shadow-card"
              >
                <Truck className="w-3.5 h-3.5 text-[#4ade80]" />
                <span className="hidden sm:inline">Smart Transport 🚚</span>
                <span className="sm:hidden">Transport</span>
              </Link>

              {/* 1-Click Role Switcher Button */}
              <button
                onClick={handleRoleToggle}
                className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all border shadow-2xs bg-white hover:bg-[#EAEFEA] text-deep-forest border-border"
                title="Click to toggle between Farmer and Buyer portals"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-primary" />
                <span className="hidden md:inline">Switch to {userRole === 'farmer' ? 'Buyer Mode' : 'Farmer Mode'}</span>
                <span className="md:hidden">{userRole === 'farmer' ? 'Buyer' : 'Farmer'}</span>
              </button>

              {/* AI Assistant Button */}
              <button
                onClick={toggleAssistant}
                className="px-3 py-1.5 bg-gradient-to-r from-emerald-800 to-primary text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-card transition-all transform hover:scale-102"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary-fixed" />
                <span className="hidden sm:inline">✦ Ask Fieldora</span>
                <span className="sm:hidden">AI</span>
              </button>

              {/* User Avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-deep-forest text-primary-fixed text-xs font-extrabold flex items-center justify-center shadow-card shrink-0">
                {userRole === 'farmer' ? 'RP' : 'SD'}
              </div>

            </div>

          </header>

          {/* Scrollable Page Body */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
            <Outlet />
          </main>

          {/* Mobile Bottom Navigation Bar */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-border flex items-center justify-around px-2 z-40 shadow-hover">
            <Link
              to={userRole === 'farmer' ? '/farmer/dashboard' : '/buyer/dashboard'}
              className={cn(
                "flex flex-col items-center justify-center text-[10px] font-medium py-1 px-2 touch-target",
                (location.pathname === '/farmer/dashboard' || location.pathname === '/buyer/dashboard') ? "text-primary font-bold" : "text-secondary"
              )}
            >
              <LayoutDashboard className="w-5 h-5 mb-0.5" />
              <span>Home</span>
            </Link>

            <Link
              to={userRole === 'farmer' ? '/farmer/transport' : '/buyer/transport'}
              className={cn(
                "flex flex-col items-center justify-center text-[10px] font-medium py-1 px-2 touch-target",
                (location.pathname === '/farmer/transport' || location.pathname === '/buyer/transport') ? "text-primary font-bold" : "text-secondary"
              )}
            >
              <Truck className="w-5 h-5 mb-0.5 text-primary" />
              <span>Transport</span>
            </Link>

            <Link
              to="/buyer/marketplace"
              className={cn(
                "flex flex-col items-center justify-center text-[10px] font-medium py-1 px-2 touch-target",
                location.pathname === '/buyer/marketplace' ? "text-primary font-bold" : "text-secondary"
              )}
            >
              <Store className="w-5 h-5 mb-0.5" />
              <span>Market</span>
            </Link>

            <Link
              to={userRole === 'farmer' ? '/farmer/orders' : '/buyer/orders'}
              className={cn(
                "flex flex-col items-center justify-center text-[10px] font-medium py-1 px-2 touch-target",
                (location.pathname === '/farmer/orders' || location.pathname === '/buyer/orders') ? "text-primary font-bold" : "text-secondary"
              )}
            >
              <PackageCheck className="w-5 h-5 mb-0.5" />
              <span>Orders</span>
            </Link>
          </div>

        </div>

      </div>

      {/* Contextual AI Assistant Drawer */}
      <AIAssistantDrawer />

      {/* Global Notifications */}
      <ToastContainer />

    </div>
  );
};
