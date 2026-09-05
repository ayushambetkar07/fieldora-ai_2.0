import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Navbar } from '../../components/layout/Navbar';
import { Wheat, Building2, CheckCircle2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export const RoleSelectPage: React.FC = () => {
  const { setUserRole, currentUser, showToast } = useApp();
  const navigate = useNavigate();

  const handleSelectRole = (role: 'farmer' | 'buyer') => {
    setUserRole(role);
    if (!currentUser) {
      showToast('Authentication Required', `Please sign in to access the ${role === 'farmer' ? 'Farmer / Producer' : 'Enterprise Buyer'} Portal.`, 'info');
      navigate(`/login?role=${role}&redirect=/${role}/dashboard`);
    } else {
      navigate(role === 'farmer' ? '/farmer/dashboard' : '/buyer/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between selection:bg-primary selection:text-white">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 py-12 lg:py-16">
        <div className="max-w-5xl w-full space-y-10 text-center">
          
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/90 border border-emerald-300 text-emerald-900 text-xs font-extrabold tracking-wide uppercase shadow-2xs">
              <span className="live-dot mr-1" />
              <span>Platinum Agri-Trade Protocol</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-heading font-extrabold text-deep-forest tracking-tight leading-tight">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-600">Fieldora</span>
            </h1>
            <p className="text-base sm:text-lg text-secondary leading-relaxed">
              Please choose how you would like to enter the platform. We'll personalize your tools and marketplace access accordingly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">
            
            {/* 1. FARMER / FPO CARD */}
            <div
              onClick={() => handleSelectRole('farmer')}
              className="glass-card-elite p-8 sm:p-10 rounded-3xl border-2 border-transparent hover:border-amber-500 hover:shadow-elite cursor-pointer group flex flex-col justify-between space-y-6 transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-b from-white/95 to-amber-50/30"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                    <Wheat className="w-8 h-8 text-amber-700" />
                  </div>
                  <span className="px-3.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-extrabold tracking-wide uppercase">
                    Farmer / FPO
                  </span>
                </div>

                <div>
                  <h2 className="font-heading font-extrabold text-2xl text-deep-forest group-hover:text-amber-800 transition-colors">
                    I am a Farmer / Producer
                  </h2>
                  <p className="text-xs sm:text-sm text-secondary mt-2 leading-relaxed">
                    For individual farmers, Farmer Producer Organizations (FPOs), and agricultural cooperatives.
                  </p>
                </div>

                {/* Bullet Points */}
                <div className="space-y-2.5 pt-2 border-t border-amber-200/60 text-xs text-deep-forest font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Direct access to institutional FMCG & corporate buyers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Real-time APMC Mandi price parity & AI rate insights</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Zero middlemen cut + 100% smart escrow payment security</span>
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectRole('farmer');
                }}
                className="w-full py-4 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white rounded-2xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 group-hover:gap-3"
              >
                <span>Enter Farmer Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* 2. BUYER / ENTERPRISE CARD */}
            <div
              onClick={() => handleSelectRole('buyer')}
              className="glass-card-elite p-8 sm:p-10 rounded-3xl border-2 border-transparent hover:border-primary hover:shadow-elite cursor-pointer group flex flex-col justify-between space-y-6 transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-b from-white/95 to-emerald-50/30"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                    <Building2 className="w-8 h-8 text-primary" />
                  </div>
                  <span className="px-3.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-xs font-extrabold tracking-wide uppercase">
                    Enterprise Buyer
                  </span>
                </div>

                <div>
                  <h2 className="font-heading font-extrabold text-2xl text-deep-forest group-hover:text-primary transition-colors">
                    I am a Buyer / Enterprise
                  </h2>
                  <p className="text-xs sm:text-sm text-secondary mt-2 leading-relaxed">
                    For FMCG corporations, millers, exporters, processors, and bulk commodity traders.
                  </p>
                </div>

                {/* Bullet Points */}
                <div className="space-y-2.5 pt-2 border-t border-emerald-200/60 text-xs text-deep-forest font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span>Procure directly from 12,400+ certified farmer groups</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span>NABL laboratory certified quality & moisture assay sheets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span>Instant bulk RFQ posting & custom procurement contracts</span>
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectRole('buyer');
                }}
                className="w-full py-4 btn-elite-primary text-white rounded-2xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 group-hover:gap-3"
              >
                <span>Enter Buyer Marketplace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

          <p className="text-xs text-secondary font-medium">
            Tip: You can switch between Farmer and Buyer portals anytime using the role badge in the top navigation bar.
          </p>

        </div>
      </main>
    </div>
  );
};
