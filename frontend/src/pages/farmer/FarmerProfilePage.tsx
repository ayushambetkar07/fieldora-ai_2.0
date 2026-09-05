import React from 'react';
import { useApp } from '../../context/AppContext';
import { Wheat, MapPin, Phone, ShieldCheck, Award, Users, CheckCircle2 } from 'lucide-react';
import { Card, Button } from '../../components/ui';

export const FarmerProfilePage: React.FC = () => {
  const { currentFarmer, produceList, signOut } = useApp();
  const activeCount = produceList.filter(p => p.farmerId === currentFarmer.id).length;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-main tracking-tight">Producer Profile</h1>
        <p className="text-xs sm:text-sm text-secondary mt-0.5">
          Manage your verified credentials, FPO affiliations, and farm statistics.
        </p>
      </div>

      <Card className="p-6 sm:p-8 space-y-6">
        
        {/* Header Profile Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-card bg-primary text-accent text-xl font-bold flex items-center justify-center shadow-card">
              RP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-main">{currentFarmer.name}</h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent-light text-primary text-xs font-bold border border-[#bbf7d0]">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent" /> Verified Producer
                </span>
              </div>
              <p className="text-xs text-secondary mt-0.5">{currentFarmer.farmName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Edit Profile
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
            <span className="text-muted block uppercase font-semibold text-[11px]">Primary Location</span>
            <div className="font-bold text-main flex items-center gap-1.5 text-sm">
              <MapPin className="w-4 h-4 text-primary" /> {currentFarmer.location}
            </div>
          </div>

          <div className="bg-[#F7F9F6] p-4 rounded-input border border-border space-y-1">
            <span className="text-muted block uppercase font-semibold text-[11px]">Registered Contact</span>
            <div className="font-bold text-main flex items-center gap-1.5 text-sm">
              <Phone className="w-4 h-4 text-primary" /> {currentFarmer.phone}
            </div>
          </div>

          <div className="bg-[#F7F9F6] p-4 rounded-input border border-border space-y-1">
            <span className="text-muted block uppercase font-semibold text-[11px]">FPO Federation Size</span>
            <div className="font-bold text-main flex items-center gap-1.5 text-sm">
              <Users className="w-4 h-4 text-primary" /> {currentFarmer.fpoMemberCount} Member Farmers
            </div>
          </div>
        </div>

        {/* Quality Certifications */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-main uppercase tracking-wider">Quality Certifications & Assays</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 border border-[#bbf7d0] bg-accent-light/30 rounded-input flex items-center gap-3">
              <Award className="w-5 h-5 text-accent shrink-0" />
              <div>
                <strong className="text-xs text-main block">NABL Certified Testing Partner</strong>
                <span className="text-[11px] text-secondary">Aflatoxin, pesticide residue & moisture verified</span>
              </div>
            </div>

            <div className="p-3.5 border border-border bg-[#F7F9F6] rounded-input flex items-center gap-3">
              <Award className="w-5 h-5 text-primary shrink-0" />
              <div>
                <strong className="text-xs text-main block">India Organic & NPOP Traceability</strong>
                <span className="text-[11px] text-secondary">Cluster certified under Paramparagat Krishi Vikas</span>
              </div>
            </div>
          </div>
        </div>

      </Card>
    </div>
  );
};
