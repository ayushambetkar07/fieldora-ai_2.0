import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { MOCK_MARKET_PRICES } from '../../data/mockData';
import { 
  Wheat, 
  Clock, 
  PackageCheck, 
  IndianRupee, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Plus, 
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Calendar,
  Truck
} from 'lucide-react';
import { StatCard } from '../../components/ui/domainCards';
import { Button, StatusBadge } from '../../components/ui';

export const FarmerDashboard: React.FC = () => {
  const { currentFarmer, produceList, requestsList, ordersList, acceptRequest, rejectRequest } = useApp();

  const myProduce = produceList.filter(p => p.farmerId === currentFarmer.id);
  const activeProduce = myProduce.filter(p => p.status === 'Active');
  const pendingRequests = requestsList.filter(r => r.farmerId === currentFarmer.id && r.status === 'Pending');
  const activeOrders = ordersList.filter(o => o.farmerId === currentFarmer.id);
  const completedOrders = ordersList.filter(o => o.farmerId === currentFarmer.id && o.status === 'Completed');

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      
      {/* 1. Header Greeting & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-main tracking-tight">
            Farmer Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            Welcome back, {currentFarmer.name} • {currentFarmer.farmName} ({currentFarmer.location})
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link to="/farmer/transport">
            <button className="px-4 py-2 bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold rounded-input flex items-center gap-1.5 shadow-card">
              <Truck className="w-4 h-4 text-[#4ade80]" />
              <span>Smart Transport</span>
            </button>
          </Link>
          <Link to="/farmer/produce/new">
            <button className="px-4 py-2 btn-deep-green text-xs font-bold rounded-input flex items-center gap-1.5 shadow-primary">
              <Plus className="w-4 h-4" />
              <span>+ Add Product</span>
            </button>
          </Link>
          <Link to="/farmer/market-prices">
            <button className="px-4 py-2 bg-white border border-[#EAEFEA] hover:bg-[#F7F8F3] text-main text-xs font-bold rounded-input shadow-xs">
              Market Prices
            </button>
          </Link>
        </div>
      </div>

      {/* 2. Overview Stat Cards (Exact Matching to Reference Image Left Screen) */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-main">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Active Listings"
            value={activeProduce.length}
            subtitle="Listed on marketplace"
            icon={Wheat}
            iconColor="text-[#166534]"
            iconBgColor="bg-[#E8F3EB]"
          />
          <StatCard
            title="Pending Requests"
            value={pendingRequests.length}
            subtitle="Direct buyer offers"
            icon={Clock}
            iconColor="text-[#D97706]"
            iconBgColor="bg-[#FEF3C7]"
          />
          <StatCard
            title="Completed Orders"
            value={completedOrders.length < 10 ? `0${completedOrders.length}` : completedOrders.length}
            subtitle="Escrow settled"
            icon={PackageCheck}
            iconColor="text-[#2563EB]"
            iconBgColor="bg-[#EFF6FF]"
          />
        </div>
      </div>

      {/* 3. Products Table (Exact Matching to Reference Image Left Screen) */}
      <div className="ref-card p-5 sm:p-6 bg-white space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-main">Products</h2>
          <Link to="/farmer/produce" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F7F8F3] text-secondary uppercase font-semibold border-b border-[#EAEFEA]">
              <tr>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Expected Price</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFEA] font-medium text-main">
              {myProduce.map((prod) => (
                <tr key={prod.id} className="hover:bg-[#F7F8F3] transition-colors">
                  <td className="py-3 px-4 font-bold text-main">
                    {prod.crop} ({prod.variety})
                  </td>
                  <td className="py-3 px-4 text-secondary">
                    {prod.quantity} {prod.unit}s
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-primary">
                    ₹{prod.expectedPrice.toLocaleString('en-IN')}/q
                  </td>
                  <td className="py-3 px-4 text-secondary">
                    {prod.harvestDate}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 bg-[#22C55E] text-white text-[10px] font-bold rounded-full shadow-xs inline-flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" /> Verified Farmer
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Recent Requests Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pending Requests */}
        <div className="ref-card p-5 sm:p-6 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-main">Recent Buyer Requests</h2>
            <Link to="/farmer/requests" className="text-xs font-bold text-primary hover:underline">
              View All ({pendingRequests.length})
            </Link>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="text-center py-6 text-xs text-secondary bg-[#F7F8F3] rounded-input">
              No pending buyer requests.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.slice(0, 2).map((req) => (
                <div key={req.id} className="p-3.5 bg-[#F7F8F3] border border-[#EAEFEA] rounded-input space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-xs text-main">{req.buyerCompany}</div>
                      <p className="text-[11px] text-secondary">
                        {req.requestedQuantity} {req.unit}s {req.cropName} • Offer: <strong className="text-primary font-mono">₹{req.offeredPrice}/q</strong>
                      </p>
                    </div>
                    <span className="text-[10px] text-muted">{req.createdDate}</span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => rejectRequest(req.id)}
                      className="px-3 py-1 bg-white border border-[#EAEFEA] text-xs font-semibold rounded-input hover:text-error"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => acceptRequest(req.id)}
                      className="px-3 py-1 btn-orange text-xs font-bold rounded-input shadow-xs"
                    >
                      Accept Offer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mandi Snapshot */}
        <div className="ref-card p-5 sm:p-6 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-main">Market Price Snapshot</h2>
            <Link to="/farmer/market-prices" className="text-xs font-bold text-primary hover:underline">
              Live Mandis
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {MOCK_MARKET_PRICES.slice(0, 2).map((m) => (
              <div key={m.id} className="p-3 bg-[#F7F8F3] border border-[#EAEFEA] rounded-input space-y-1">
                <div className="text-xs font-bold text-main">{m.crop}</div>
                <div className="text-lg font-bold font-mono text-primary">₹{m.currentPrice.toLocaleString('en-IN')}<span className="text-xs font-normal text-secondary">/q</span></div>
                <div className="text-[11px] text-accent font-semibold flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> +{m.changePercent}% vs last week
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
