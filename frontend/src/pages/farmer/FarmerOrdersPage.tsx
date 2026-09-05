import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PackageCheck, MapPin, IndianRupee, Scale, ShieldCheck, ChevronDown, ChevronUp, Truck } from 'lucide-react';
import { Card, StatusBadge, Button } from '../../components/ui';
import { OrderTimeline } from '../../components/ui/OrderTimeline';
import { EmptyState } from '../../components/ui/feedback';

export const FarmerOrdersPage: React.FC = () => {
  const { currentFarmer, ordersList } = useApp();
  const myOrders = ordersList.filter(o => o.farmerId === currentFarmer.id);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(myOrders[0]?.id || null);

  const toggleExpand = (id: string) => {
    setExpandedOrderId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-main tracking-tight">
            Order Fulfillment & Logistics
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            Track real-time shipment status, NABL laboratory assay logs, and smart escrow disbursements.
          </p>
        </div>

        <Link to="/farmer/transport">
          <Button variant="primary" size="sm" className="flex items-center gap-1.5 shadow-card">
            <Truck className="w-4 h-4 text-[#4ade80]" />
            <span>Direct Farm Transport</span>
          </Button>
        </Link>
      </div>

      {myOrders.length === 0 ? (
        <EmptyState
          icon={PackageCheck}
          title="No active orders found"
          description="When you accept incoming buyer requests, confirmed purchase orders and escrow contracts will appear here."
          actionLabel="View Buyer Requests"
          onAction={() => window.location.href = '#/farmer/requests'}
        />
      ) : (
        <div className="space-y-5">
          {myOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;

            return (
              <Card key={order.id} className="p-6 space-y-5 border-border hover:shadow-hover transition-shadow">
                
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-base text-primary">
                        Order #{order.orderNumber}
                      </span>
                      <StatusBadge status={order.status} />
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent-light text-primary border border-[#bbf7d0] flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-accent" /> {order.paymentStatus}
                      </span>
                    </div>
                    <p className="text-xs text-secondary">
                      Ordered on {order.orderDate} • Expected Delivery: {order.expectedDeliveryDate}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-muted uppercase font-semibold block">Total Contract Amount</span>
                      <span className="text-xl font-bold font-mono text-main">
                        ₹{order.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <Link to={`/farmer/transport?orderId=${order.id}`}>
                      <Button variant="secondary" size="sm" className="flex items-center gap-1.5 shrink-0">
                        <Truck className="w-4 h-4 text-primary" />
                        <span>Direct Transport</span>
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#F7F9F6] p-4 rounded-input border border-border">
                  <div>
                    <span className="text-muted block text-[11px]">Produce Lot</span>
                    <span className="font-bold text-main">{order.crop}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[11px]">Contract Volume</span>
                    <span className="font-bold text-main">{order.quantity} {order.unit}s</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[11px]">Agreed Unit Rate</span>
                    <span className="font-bold text-primary font-mono">₹{order.pricePerUnit}/q</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[11px]">Institutional Buyer</span>
                    <span className="font-bold text-main truncate block">{order.buyerCompany}</span>
                  </div>
                </div>

                {/* Vertical Order Timeline Tracker */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                      Milestone Timeline & Escrow Verification
                    </span>
                    <button
                      onClick={() => toggleExpand(order.id)}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      <span>{isExpanded ? 'Hide Details' : 'View Step Details'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="bg-[#FAFCFA] border border-border p-4 sm:p-6 rounded-input">
                      <OrderTimeline order={order} />
                    </div>
                  )}
                </div>

              </Card>
            );
          })}
        </div>
      )}

    </div>
  );
};
