import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Navbar } from '../../components/layout/Navbar';
import { Wheat, Building2, Lock, ArrowRight, ShieldCheck, Mail, Loader2, Sparkles } from 'lucide-react';
import { Button, Input, Card } from '../../components/ui';

export const LoginPage: React.FC = () => {
  const { userRole, setUserRole, signIn, showToast } = useApp();
  const [searchParams] = useSearchParams();
  const queryRole = searchParams.get('role') as 'farmer' | 'buyer' | null;
  const redirectPath = searchParams.get('redirect');

  const [selectedRole, setSelectedRole] = useState<'farmer' | 'buyer'>(queryRole || userRole);
  const [email, setEmail] = useState((queryRole || userRole) === 'farmer' ? 'farmer.rajendra@fieldora.in' : 'buyer.freshmart@fieldora.in');
  const [password, setPassword] = useState((queryRole || userRole) === 'farmer' ? 'FarmTrade#2026' : 'BuyerTrade#2026');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();

  // 1-Click Demo Login Credentials
  const handleQuickFill = (role: 'farmer' | 'buyer') => {
    setSelectedRole(role);
    setUserRole(role);
    setAuthError(null);
    if (role === 'farmer') {
      setEmail('farmer.rajendra@fieldora.in');
      setPassword('FarmTrade#2026');
    } else {
      setEmail('buyer.freshmart@fieldora.in');
      setPassword('BuyerTrade#2026');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);

    const result = await signIn({ email, password });
    setIsLoading(false);

    if (result.success) {
      if (redirectPath) {
        navigate(redirectPath);
      } else {
        navigate(selectedRole === 'farmer' ? '/farmer/dashboard' : '/buyer/dashboard');
      }
    } else {
      setAuthError(result.error || 'Invalid credentials. Please check your email/password.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between selection:bg-primary selection:text-white">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <Card className="max-w-md w-full p-6 sm:p-8 space-y-6 shadow-card">
          
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-deep-forest text-white flex items-center justify-center mx-auto shadow-card">
              <Wheat className="w-6 h-6 text-primary-fixed" />
            </div>
            <h1 className="text-2xl font-bold text-main tracking-tight font-heading">Sign In to Fieldora</h1>
            <p className="text-xs text-secondary">Live Supabase Authentication & Agricultural Portal</p>
          </div>

          {/* 1-Click Instant Demo Credentials */}
          <div className="p-3.5 bg-[#F4F9F5] border border-[#a7f3d0] rounded-2xl space-y-2">
            <span className="text-[11px] font-bold text-deep-forest flex items-center gap-1.5 uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> 1-Click Fast Login
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('farmer')}
                className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                  selectedRole === 'farmer' && email.includes('farmer')
                    ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-2xs'
                    : 'bg-white border-border hover:bg-gray-50 text-secondary'
                }`}
              >
                <span className="block text-[10px] text-amber-700">🌾 Farmer</span>
                <span>Rajendra Patel</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('buyer')}
                className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                  selectedRole === 'buyer' && email.includes('buyer')
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-900 shadow-2xs'
                    : 'bg-white border-border hover:bg-gray-50 text-secondary'
                }`}
              >
                <span className="block text-[10px] text-emerald-700">🏢 Buyer</span>
                <span>FreshMart Agro</span>
              </button>
            </div>
          </div>

          {/* Role Toggle Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F7F9F6] border border-border rounded-input">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('farmer');
                setUserRole('farmer');
              }}
              className={`py-2 text-xs font-bold rounded-button flex items-center justify-center gap-1.5 transition-colors ${
                selectedRole === 'farmer' ? 'bg-[#166534] text-white shadow-card' : 'text-secondary hover:text-main'
              }`}
            >
              <Wheat className="w-3.5 h-3.5" /> Farmer / FPO
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedRole('buyer');
                setUserRole('buyer');
              }}
              className={`py-2 text-xs font-bold rounded-button flex items-center justify-center gap-1.5 transition-colors ${
                selectedRole === 'buyer' ? 'bg-[#004c22] text-white shadow-card' : 'text-secondary hover:text-main'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" /> Enterprise Buyer
            </button>
          </div>

          {authError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-main mb-1">Email Address</label>
              <Input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-main mb-1">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
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
                  <span>Verifying with Supabase...</span>
                </>
              ) : (
                <>
                  <span>Sign In to {selectedRole === 'farmer' ? 'Farmer Portal' : 'Buyer Portal'}</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </>
              )}
            </Button>
          </form>

          <div className="text-center pt-2 border-t border-border space-y-2">
            <p className="text-xs text-secondary">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary font-bold hover:underline">
                Create Account
              </Link>
            </p>
            <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Secured by Supabase Auth (JWT & RLS)</span>
            </div>
          </div>

        </Card>
      </main>
    </div>
  );
};
