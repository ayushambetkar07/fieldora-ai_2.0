import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  ClipboardList, 
  PackageCheck, 
  IndianRupee, 
  Store, 
  PlusCircle, 
  Search, 
  ArrowRight,
  Sparkles,
  MapPin,
  Scale,
  BadgeCheck,
  Truck
} from 'lucide-react';
import { StatCard, ProduceCard } from '../../components/ui/domainCards';
import { Button, Card, StatusBadge } from '../../components/ui';

export const BuyerDashboard: React.FC = () => {
  const { currentBuyer, produceList, requirementsList, ordersList } = useApp();

  const myRequirements = requirementsList.filter(r => r.buyerId === currentBuyer.id);
  const myOrders = ordersList.filter(o => o.buyerId === currentBuyer.id);
  
  const totalSpent = myOrders.reduce((acc, o) => acc + o.totalAmount, 0);
  const recommendedProduce = produceList.slice(0, 3);

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-main tracking-tight">
            Procurement Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            {currentBuyer.companyName} • {currentBuyer.location}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link to="/buyer/transport">
            <Button variant="primary" size="sm" className="flex items-center gap-1.5 shadow-card bg-[#166534] hover:bg-[#14532d]">
              <Truck className="w-4 h-4 text-[#4ade80]" />
              <span>Smart Transport</span>
            </Button>
          </Link>
          <Link to="/buyer/marketplace">
            <Button variant="outline" size="sm" className="flex items-center gap-1.5 shadow-card">
              <Search className="w-4 h-4" />
              <span>Search Produce</span>
            </Button>
          </Link>
          <Link to="/buyer/requirements/new">
            <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-primary" />
              <span>Post Requirement</span>
            </Button>
          </Link>
          <Link to="/buyer/orders">
            <Button variant="outline" size="sm">
              View Orders
            </Button>
          </Link>
        </div>
      </div>

      {/* 1. Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Requirements"
          value={myRequirements.length}
          subtitle="Open procurement tenders"
          icon={ClipboardList}
          iconColor="text-primary"
        />
        <StatCard
          title="Orders In Progress"
          value={myOrders.filter(o => o.status !== 'Completed').length}
          subtitle="In transit / milestone active"
          icon={PackageCheck}
          iconColor="text-info-dark"
        />
        <StatCard
          title="Completed Deliveries"
          value={myOrders.filter(o => o.status === 'Completed').length}
          subtitle="Verified assay releases"
          icon={Store}
          iconColor="text-accent"
        />
        <StatCard
          title="Procurement Volume"
          value={`₹${(totalSpent / 1000).toFixed(0)}k`}
          subtitle="Total trade through escrow"
          icon={IndianRupee}
          iconColor="text-primary"
        />
      </div>

      {/* 2. Recommended Produce & AI Prompt banner */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-main">Recommended Farm-Gate Produce</h2>
            <p className="text-xs text-secondary">Verified harvest lots matching your procurement profile</p>
          </div>
          <Link to="/buyer/marketplace" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            <span>Browse Full Marketplace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendedProduce.map((prod) => (
            <ProduceCard
              key={prod.id}
              produce={prod}
              onContact={() => window.location.href = `#/buyer/produce/${prod.id}`}
            />
          ))}
        </div>
      </div>

      {/* 3. Recent Orders Summary */}
      <Card className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-main">Active Contract Orders</h2>
            <p className="text-xs text-secondary">Milestone status and delivery weighbridge logs</p>
          </div>
          <Link to="/buyer/orders" className="text-xs font-bold text-primary hover:underline">
            View All ({myOrders.length})
          </Link>
        </div>

        {myOrders.length === 0 ? (
          <div className="text-center py-8 text-xs text-secondary bg-[#F7F9F6] rounded-input">
            No active orders in progress.
          </div>
        ) : (
          <div className="space-y-3">
            {myOrders.map((order) => (
              <div key={order.id} className="p-4 bg-[#F7F9F6] border border-border rounded-input flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-primary">#{order.orderNumber}</span>
                    <span className="text-xs font-bold text-main">{order.crop} ({order.quantity} {order.unit}s)</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-xs text-secondary">
                    Farmer: <strong>{order.farmerName}</strong> ({order.farmerFarm}) • Expected by {order.expectedDeliveryDate}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right font-mono font-bold text-main text-sm">
                    ₹{order.totalAmount.toLocaleString('en-IN')}
                  </div>
                  <Link
                    to="/buyer/orders"
                    className="px-3 py-1.5 bg-white border border-border text-xs font-semibold rounded-button text-main hover:bg-[#EAEFEA] transition-colors"
                  >
                    Track Shipment
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

    </div>
  );
};
