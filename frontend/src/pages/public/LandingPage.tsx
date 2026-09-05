import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { useApp } from '../../context/AppContext';
import { 
  Wheat, 
  Store, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Scale, 
  FileText, 
  PackageCheck, 
  Search,
  Building2,
  Users,
  BadgeCheck,
  Award,
  User,
  ShoppingBag
} from 'lucide-react';
import { Button } from '../../components/ui';

export const LandingPage: React.FC = () => {
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
    <div className="min-h-screen bg-[#F7F8F3] flex flex-col justify-between selection:bg-primary selection:text-white">
      <Navbar />

      {/* 1. HERO SECTION (Exact matching to Reference Image) */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28 text-center">
        {/* Soft Background Leaf Watermark Decors */}
        <div className="absolute top-12 left-6 lg:left-20 opacity-10 pointer-events-none">
          <svg width="240" height="240" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 20C60 20 20 60 20 100C20 150 70 180 100 180C130 180 180 150 180 100C180 60 140 20 100 20Z" stroke="#166534" strokeWidth="8"/>
            <path d="M100 20V180" stroke="#166534" strokeWidth="6"/>
          </svg>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E8F3EB] border border-[#bbf7d0] text-[#166534] text-xs font-bold">
            <span className="live-dot" />
            <span>Connecting Farms to Opportunities</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-heading font-extrabold text-main tracking-tight leading-tight">
            From Farm to Buyer, <br />
            <span className="text-primary">Without the Barriers.</span>
          </h1>

          <p className="text-base sm:text-lg text-secondary max-w-2xl mx-auto leading-relaxed">
            Connecting Farms to Opportunities, an intelligent agricultural marketplace directly connecting farmers and FPOs with buyers through transparent prices and smart discovery.
          </p>

          {/* Reference Dual CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => handleSelectRole('buyer')}
              className="px-8 py-3.5 btn-deep-green text-sm font-bold rounded-input shadow-primary flex items-center gap-2"
            >
              <Store className="w-4 h-4" />
              <span>Explore Marketplace</span>
            </button>

            <button
              onClick={() => handleSelectRole('farmer')}
              className="px-8 py-3.5 bg-white border border-[#166534]/30 hover:border-[#166534] text-main hover:text-primary text-sm font-bold rounded-input shadow-xs transition-colors"
            >
              <span>Join as a Farmer</span>
            </button>
          </div>

          {/* Trust Highlights */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs font-semibold text-secondary">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#22C55E]" /> Direct Farm-Gate Pricing
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#22C55E]" /> Real-time Mandi Benchmark
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#22C55E]" /> 100% Escrow Secured
            </span>
          </div>

        </div>
      </section>

      {/* 2. HOW IT WORKS (Connected Diagram matching Reference Image) */}
      <section className="py-16 sm:py-20 bg-white border-y border-[#EAEFEA]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-main">
              How It Works
            </h2>
            <p className="text-xs sm:text-sm text-secondary">
              Start now on Fieldora and seamlessly experience how it works.
            </p>
          </div>

          {/* 3-Part Connected Visual Diagram */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* For Farmers Card (5 cols) */}
            <div className="md:col-span-5 bg-[#F7F8F3] border border-[#EAEFEA] rounded-2xl p-6 sm:p-8 space-y-4 text-center ref-card">
              <span className="inline-block px-3 py-1 bg-[#166534] text-white text-xs font-bold rounded-full">
                For Farmers
              </span>

              <div className="w-16 h-16 rounded-2xl bg-[#E8F3EB] text-[#166534] flex items-center justify-center mx-auto shadow-xs">
                <Wheat className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-main">Farmer / FPO</h3>
                <p className="text-xs text-secondary mt-1.5 leading-relaxed">
                  Farmers list their quality produce lots with transparent pricing and receive direct purchase offers from verified institutional buyers.
                </p>
              </div>

              <button
                onClick={() => handleSelectRole('farmer')}
                className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 pt-1"
              >
                <span>Enter Farmer Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Center Connection Arrow & Brand Hub (2 cols) */}
            <div className="md:col-span-2 flex flex-col items-center justify-center text-center space-y-2 py-4">
              <div className="w-12 h-12 rounded-2xl bg-[#166534] text-white flex items-center justify-center shadow-md">
                <Wheat className="w-6 h-6 text-[#22C55E]" />
              </div>
              <span className="text-xs font-bold text-primary font-heading uppercase tracking-wider">Fieldora</span>
              <div className="hidden md:flex items-center text-muted gap-1 text-xs">
                <span>Direct</span> →
              </div>
            </div>

            {/* For Buyers Card (5 cols) */}
            <div className="md:col-span-5 bg-[#F7F8F3] border border-[#EAEFEA] rounded-2xl p-6 sm:p-8 space-y-4 text-center ref-card">
              <span className="inline-block px-3 py-1 bg-[#F59E0B] text-white text-xs font-bold rounded-full">
                For Buyers
              </span>

              <div className="w-16 h-16 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center mx-auto shadow-xs">
                <Building2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-main">Enterprise Buyer</h3>
                <p className="text-xs text-secondary mt-1.5 leading-relaxed">
                  Buyers discover farm-fresh lots directly with natural language search, publish procurement tenders, and track deliveries through escrow.
                </p>
              </div>

              <button
                onClick={() => handleSelectRole('buyer')}
                className="text-xs font-bold text-warning-dark hover:underline inline-flex items-center gap-1 pt-1"
              >
                <span>Browse Marketplace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* 3. PLATFORM STATISTICS */}
      <section className="py-12 border-b border-[#EAEFEA] bg-[#F7F8F3]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-heading font-extrabold font-mono text-primary">12,400+</div>
              <div className="text-xs font-bold text-secondary uppercase tracking-wider">Certified Farmers & FPOs</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-heading font-extrabold font-mono text-primary">850+</div>
              <div className="text-xs font-bold text-secondary uppercase tracking-wider">Enterprise Buyers</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-heading font-extrabold font-mono text-primary">45,000+ MT</div>
              <div className="text-xs font-bold text-secondary uppercase tracking-wider">Verified Produce Traded</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-heading font-extrabold font-mono text-primary">₹48+ Cr</div>
              <div className="text-xs font-bold text-secondary uppercase tracking-wider">Smart Escrow Settled</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FOOTER */}
      <footer className="py-8 bg-[#17211B] text-xs text-white/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#166534] text-white flex items-center justify-center font-bold">
              <Wheat className="w-4 h-4 text-[#22C55E]" />
            </div>
            <span className="font-heading font-extrabold text-white text-base">Fieldora</span>
            <span className="text-white/50">• © 2026 Fieldora Technologies Inc.</span>
          </div>
          <div className="flex gap-6 text-white/80">
            <Link to="/buyer/marketplace" className="hover:text-[#22C55E] transition-colors">Marketplace</Link>
            <Link to="/roles" className="hover:text-[#22C55E] transition-colors">Portals</Link>
            <Link to="/login" className="hover:text-[#22C55E] transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>

    </div>
  );
};
