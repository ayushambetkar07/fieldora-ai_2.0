import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Navbar } from '../../components/layout/Navbar';
import { Wheat, Building2, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { Button, Input, Card } from '../../components/ui';

export const SignupPage: React.FC = () => {
  const { signUp, showToast } = useApp();
  const [selectedRole, setSelectedRole] = useState<'farmer' | 'buyer'>('farmer');
  const [name, setName] = useState('Rajendra Patel');
  const [email, setEmail] = useState('rajendra.fpo@fieldora.in');
  const [password, setPassword] = useState('FarmTrade#2026');
  const [organization, setOrganization] = useState('Raj Farms & Agro Cooperative');
  const [location, setLocation] = useState('Nashik, Maharashtra');
  const [phone, setPhone] = useState('+91 98234 11200');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const res = await signUp({
      email,
      password,
      role: selectedRole,
      name,
      phone,
      location,
      organization,
    });

    setIsLoading(false);

    if (res.success) {
      navigate(selectedRole === 'farmer' ? '/farmer/dashboard' : '/buyer/dashboard');
    } else {
      setErrorMsg(res.error || 'Failed to create account. Please check details.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between selection:bg-primary selection:text-white">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <Card className="max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-card">
          
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-deep-forest text-white flex items-center justify-center mx-auto shadow-card">
              <Wheat className="w-6 h-6 text-primary-fixed" />
            </div>
            <h1 className="text-2xl font-bold text-main tracking-tight font-heading">Join Fieldora Network</h1>
            <p className="text-xs text-secondary">Create your verified account on Supabase</p>
          </div>

          {/* Role Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-main uppercase tracking-wider">Select Primary Role</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('farmer');
                  if (organization.includes('Enterprise')) setOrganization('Raj Farms & Agro Cooperative');
                }}
                className={`p-3 text-left border rounded-input transition-all ${
                  selectedRole === 'farmer' 
                    ? 'border-[#166534] bg-emerald-50 text-deep-forest shadow-2xs font-bold' 
                    : 'border-border bg-card text-secondary hover:border-primary'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <Wheat className="w-4 h-4 text-emerald-700" /> Farmer / FPO
                </div>
                <p className="text-[11px] text-secondary mt-1">List harvest & view mandi prices</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('buyer');
                  if (organization.includes('Farms')) setOrganization('ABC Global Foods Pvt Ltd');
                }}
                className={`p-3 text-left border rounded-input transition-all ${
                  selectedRole === 'buyer' 
                    ? 'border-[#004c22] bg-[#F2F6F3] text-primary font-bold shadow-2xs' 
                    : 'border-border bg-card text-secondary hover:border-primary'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <Building2 className="w-4 h-4 text-deep-forest" /> Enterprise Buyer
                </div>
                <p className="text-[11px] text-secondary mt-1">Procure directly with escrow</p>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-main mb-1">Full Name</label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-main mb-1">Email Address</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-main mb-1">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-main mb-1">
                  {selectedRole === 'farmer' ? "Farm / FPO Name" : "Company / Firm Name"}
                </label>
                <Input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-main mb-1">Primary Phone</label>
                <Input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-main mb-1">Base Location</label>
                <Input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              size="md" 
              className="w-full font-bold shadow-card flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering on Supabase...</span>
                </>
              ) : (
                <>
                  <span>Create {selectedRole === 'farmer' ? 'Farmer' : 'Buyer'} Account</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </>
              )}
            </Button>
          </form>

          <div className="text-center pt-2 border-t border-border space-y-2">
            <p className="text-xs text-secondary">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">
                Sign In
              </Link>
            </p>
            <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Identity & RLS Secured by Supabase</span>
            </div>
          </div>

        </Card>
      </main>
    </div>
  );
};
