import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wheat, Store, HelpCircle, Sparkles, ArrowRight, UserRound, Truck, PlusCircle } from 'lucide-react';
import { TickerTape } from './TickerTape';
import { useApp } from '../../context/AppContext';

export const Navbar: React.FC = () => {
  const { toggleAssistant } = useApp();
  return (
    <div className="sticky top-0 z-40">
      <TickerTape />
      
      <header className="glass-nav h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-white/80">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-deep-forest flex items-center justify-center text-white shadow-card group-hover:scale-105 transition-transform">
              <Wheat className="w-5 h-5 text-primary-fixed" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-2xl text-deep-forest tracking-tight block leading-none">
                Fieldora
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-primary block mt-0.5">
                Platinum Elite
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium">
            <Link 
              to="/buyer/marketplace" 
              className="text-secondary hover:text-primary transition-colors flex items-center gap-1.5 font-semibold"
            >
              <Store className="w-4 h-4 text-primary" /> Marketplace
            </Link>
            <Link 
              to="/buyer/transport" 
              className="text-secondary hover:text-primary transition-colors flex items-center gap-1.5 font-semibold"
            >
              <Truck className="w-4 h-4 text-[#166534]" /> Smart Transport
            </Link>
            <a 
              href="#how-it-works" 
              className="text-secondary hover:text-primary transition-colors flex items-center gap-1.5 font-semibold"
            >
              <HelpCircle className="w-4 h-4" /> How It Works
            </a>
            <a 
              href="#intelligence" 
              className="text-secondary hover:text-primary transition-colors flex items-center gap-1.5 font-semibold"
            >
              <Sparkles className="w-4 h-4 text-accent" /> Intelligence
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Ask Fieldora Button */}
            <button 
              onClick={toggleAssistant}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-800 to-deep-forest text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-card hover:scale-102 transition-transform cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#a7f3d0]" />
              <span className="hidden sm:inline">✦ Ask Fieldora</span>
              <span className="sm:hidden">AI</span>
            </button>

            {/* Sign In Button */}
            <Link to="/login">
              <button className="px-3.5 py-2 border border-[#E6ECE6] hover:bg-[#F8FAF9] text-xs font-bold rounded-xl text-deep-forest transition-colors cursor-pointer">
                Sign In
              </button>
            </Link>

            {/* Post RFQ Button */}
            <Link to="/buyer/requirements/create">
              <button className="px-4 py-2 bg-deep-forest hover:bg-deep-forest-hover text-white text-xs font-bold rounded-xl shadow-button flex items-center gap-1.5 transition-all cursor-pointer">
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Post RFQ</span>
              </button>
            </Link>
          </div>

        </div>
      </header>
    </div>
  );
};
