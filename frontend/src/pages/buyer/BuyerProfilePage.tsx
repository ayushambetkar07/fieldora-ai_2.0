import React from 'react';
import { useApp } from '../../context/AppContext';
import { Building2, MapPin, Phone, ShieldCheck, FileCheck, CheckCircle2 } from 'lucide-react';
import { Card, Button } from '../../components/ui';

export const BuyerProfilePage: React.FC = () => {
  const { currentBuyer, signOut } = useApp();

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-main tracking-tight">Institutional Buyer Profile</h1>
        <p className="text-xs sm:text-sm text-secondary mt-0.5">
          Enterprise verification credentials, GSTIN registration, and procurement billing settings.
        </p>
      </div>

      <Card className="p-6 sm:p-8 space-y-6">
        
        {/* Header Profile Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-card bg-info-light text-primary text-xl font-bold flex items-center justify-center shadow-card">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-main">{currentBuyer.companyName}</h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent-light text-primary text-xs font-bold border border-[#bbf7d0]">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent" /> Verified Enterprise
                </span>
              </div>
              <p className="text-xs text-secondary mt-0.5">Procurement Lead: {currentBuyer.name} • {currentBuyer.companyType}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Edit Enterprise Details
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={async () => {
                await signOut();
                window.location.href = '/login';
              }}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-[#F7F9F6] p-4 rounded-input border border-border space-y-1">
            <span className="text-muted block uppercase font-semibold text-[11px]">Primary Headquarters</span>
            <div className="font-bold text-main flex items-center gap-1.5 text-sm">
              <MapPin className="w-4 h-4 text-primary" /> {currentBuyer.location}
            </div>
          </div>

          <div className="bg-[#F7F9F6] p-4 rounded-input border border-border space-y-1">
            <span className="text-muted block uppercase font-semibold text-[11px]">Registered Contact</span>
            <div className="font-bold text-main flex items-center gap-1.5 text-sm">
              <Phone className="w-4 h-4 text-primary" /> {currentBuyer.phone}
            </div>
          </div>

          <div className="bg-[#F7F9F6] p-4 rounded-input border border-border space-y-1">
            <span className="text-muted block uppercase font-semibold text-[11px]">Verified GSTIN Number</span>
            <div className="font-bold text-main flex items-center gap-1.5 text-sm font-mono">
              <FileCheck className="w-4 h-4 text-primary" /> {currentBuyer.gstNumber}
            </div>
          </div>
        </div>

        {/* Institutional Escrow Account */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-main uppercase tracking-wider">Settlement & Escrow Guarantee</h3>
          <div className="p-4 border border-[#bbf7d0] bg-accent-light/30 rounded-input space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-main">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-accent" /> Fieldora Smart Escrow Linked
              </span>
              <span className="text-accent font-mono">Active & Verified</span>
            </div>
            <p className="text-secondary leading-relaxed">
              Automated milestone disbursement enabled. Escrow funds are secured in scheduled commercial partner banks and released upon electronic weighbridge sign-off.
            </p>
          </div>
        </div>

      </Card>
    </div>
  );
};
