import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  PackageCheck, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Truck,
  MapPin,
  Scale,
  IndianRupee,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { Card, StatusBadge, Button, cn } from '../../components/ui';
import { OrderTimeline } from '../../components/ui/OrderTimeline';
import { EmptyState } from '../../components/ui/feedback';
import { 
  ShipmentArrivalModal, 
  QualityVerificationModal, 
  ReleasePayoutModal 
} from '../../components/orders/OrderActionModals';
import { OrderItem } from '../../types';

export const BuyerOrdersPage: React.FC = () => {
  const { 
    currentBuyer, 
    ordersList, 
    markOrderArrived, 
    verifyOrderQuality, 
    releaseOrderPayout,
    lockOrderEscrow,
    dispatchOrder
  } = useApp();

  const myOrders = ordersList.filter(o => o.buyerId === currentBuyer.id);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(myOrders[0]?.id || null);

  // Modal States
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [activeModal, setActiveModal] = useState<'arrive' | 'verify' | 'payout' | null>(null);
  const [lockingOrderId, setLockingOrderId] = useState<string | null>(null);
  const [dispatchingOrderId, setDispatchingOrderId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedOrderId(prev => prev === id ? null : id);
  };

  const handleOpenModal = (order: OrderItem, modalType: 'arrive' | 'verify' | 'payout') => {
    setSelectedOrder(order);
    setActiveModal(modalType);
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
    setActiveModal(null);
  };

  const handleLockEscrow = async (orderId: string) => {
    if (lockingOrderId) return;
    setLockingOrderId(orderId);
    try {
      await lockOrderEscrow(orderId);
    } finally {
      setLockingOrderId(null);
    }
  };

  const handleDispatchTransport = async (orderId: string) => {
    if (dispatchingOrderId) return;
    setDispatchingOrderId(orderId);
    try {
      await dispatchOrder(orderId);
    } finally {
      setDispatchingOrderId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#166534] tracking-tight font-heading">
            Procurement Orders & Logistics
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            Track weighbridge delivery inspections and electronic escrow release status.
          </p>
        </div>

        <Link to="/buyer/transport">
          <Button variant="primary" size="sm" className="flex items-center gap-1.5 shadow-card bg-[#166534] hover:bg-[#14532d]">
            <Truck className="w-4 h-4 text-[#4ade80]" />
            <span>Smart Direct Transport</span>
          </Button>
        </Link>
      </div>

      {myOrders.length === 0 ? (
        <EmptyState
          icon={PackageCheck}
          title="No active procurement orders"
          description="Send purchase requests on verified produce lots to initiate escrow-backed orders."
          actionLabel="Search Marketplace"
          onAction={() => window.location.href = '#/buyer/marketplace'}
        />
      ) : (
        <div className="space-y-5">
          {myOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const isTransportConfirmed = order.status === 'Transport Confirmed' || order.transportConfirmed === true || ['Escrow Locked', 'In Transit', 'Arrived', 'Quality Verified', 'Completed'].includes(order.status);
            const isAwaitingFarmerConfirm = order.status === 'Confirmed' && !order.transportConfirmed;
            const isEscrowLocked = order.paymentStatus === 'Escrow Locked' || order.paymentStatus === 'Released' || ['In Transit', 'Arrived', 'Quality Verified', 'Completed'].includes(order.status);
            const isInTransit = ['In Transit', 'in_transit', 'Arrived', 'Quality Verified', 'Completed'].includes(order.status);
            const isQualityVerified = ['Quality Verified', 'Completed'].includes(order.status);
            const isCompleted = order.status === 'Completed' || order.paymentStatus === 'Released';

            const canLockEscrow = isTransportConfirmed && order.paymentStatus === 'Pending' && !isEscrowLocked;
            const canDispatch = isEscrowLocked && !isInTransit && !isCompleted;
            const canMarkArrived = order.status === 'In Transit';
            const canVerify = order.status === 'Arrived';
            const canReleasePayout = order.status === 'Quality Verified';

            return (
              <Card key={order.id} className="p-6 space-y-5 border-border hover:shadow-hover transition-shadow bg-white rounded-2xl">
                
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-base text-primary">
                        Order #{order.orderNumber}
                      </span>
                      <span className="text-xs text-secondary font-medium">
                        {order.quantity} {order.unit} {order.crop} (₹{(order.payoutAmount || order.totalAmount).toLocaleString('en-IN')}) • Producer: {order.farmerName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    <Link to={`/buyer/transport?orderId=${order.id}`}>
                      <Button variant="primary" size="sm" className="bg-[#166534] hover:bg-[#14532d] flex items-center gap-1.5 shadow-card shrink-0">
                        <Truck className="w-4 h-4 text-[#4ade80]" />
                        <span>Find Transport</span>
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* 6-Stage Progress Milestones (Matching Reference) */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs pt-1">
                  <div className="p-2.5 bg-[#dcfce7] border border-[#a7f3d0] rounded-xl text-center text-deep-forest">
                    <span className="font-bold text-xs block">1. Confirmed</span>
                    <span className="text-[10px] text-emerald-800">{order.orderDate || '11 Sept 2026'}</span>
                  </div>
                  <div className={cn(
                    "p-2.5 rounded-xl text-center",
                    isTransportConfirmed 
                      ? "bg-[#dcfce7] border border-[#a7f3d0] text-deep-forest" 
                      : (isAwaitingFarmerConfirm ? "bg-amber-50 border border-amber-300 text-amber-900 font-bold" : "bg-[#F8FAF9] border border-[#E6ECE6] text-gray-400")
                  )}>
                    <span className="font-bold text-xs block">2. Transport Confirmed</span>
                    <span className="text-[10px] block">{isTransportConfirmed ? 'Confirmed by Farmer' : 'Awaiting Farmer'}</span>
                  </div>
                  <div className={cn(
                    "p-2.5 rounded-xl text-center",
                    isEscrowLocked
                      ? "bg-[#dcfce7] border border-[#a7f3d0] text-deep-forest"
                      : (canLockEscrow ? "bg-amber-50 border border-amber-300 text-amber-900 font-bold" : "bg-[#F8FAF9] border border-[#E6ECE6] text-gray-400")
                  )}>
                    <span className="font-bold text-xs block">3. Escrow Locked</span>
                    <span className="text-[10px] block">{isEscrowLocked ? `₹${order.totalAmount.toLocaleString('en-IN')} Locked` : 'Pending Escrow'}</span>
                  </div>
                  <div className={cn(
                    "p-2.5 rounded-xl text-center",
                    isInTransit
                      ? "bg-[#dcfce7] border border-[#a7f3d0] text-deep-forest"
                      : (canDispatch ? "bg-amber-50 border border-amber-300 text-amber-900 font-bold" : "bg-[#F8FAF9] border border-[#E6ECE6] text-gray-400")
                  )}>
                    <span className="font-bold text-xs block">4. In Transit</span>
                    <span className="text-[10px] block">{isInTransit ? 'In Transit' : 'Pending Dispatch'}</span>
                  </div>
                  <div className={cn(
                    "p-2.5 rounded-xl text-center",
                    isQualityVerified
                      ? "bg-[#dcfce7] border border-[#a7f3d0] text-deep-forest"
                      : (order.status === 'Arrived' ? "bg-blue-100 border border-blue-300 text-blue-900 font-bold" : "bg-[#F8FAF9] border border-[#E6ECE6] text-gray-400")
                  )}>
                    <span className="font-bold text-xs block">5. Quality Verified</span>
                    <span className="text-[10px] block">{isQualityVerified ? (order.qualityGrade ? `${order.qualityGrade} Verified` : 'Grade A Verified') : 'Pending Arrival'}</span>
                  </div>
                  <div className={cn(
                    "p-2.5 rounded-xl text-center",
                    isCompleted
                      ? "bg-[#dcfce7] border border-[#a7f3d0] text-deep-forest"
                      : "bg-[#F8FAF9] border border-[#E6ECE6] text-gray-400"
                  )}>
                    <span className="font-bold text-xs block">6. Completed</span>
                    <span className="text-[10px] block">{isCompleted ? `₹${(order.payoutAmount || order.totalAmount).toLocaleString('en-IN')} Settled` : 'Bank Payout'}</span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#F7F9F6] p-4 rounded-input border border-border">
                  <div>
                    <span className="text-muted block text-[11px]">Commodity</span>
                    <span className="font-bold text-main">{order.crop}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[11px]">Contract Volume</span>
                    <span className="font-bold text-main">{order.quantity} {order.unit}s</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[11px]">Contract Rate</span>
                    <span className="font-bold text-primary font-mono">₹{order.pricePerUnit}/q</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[11px]">Producer / FPO</span>
                    <span className="font-bold text-main truncate block">{order.farmerName}</span>
                  </div>
                </div>

                {/* Verification / Payout Summary Banner if available */}
                {(order.status === 'Quality Verified' || order.status === 'Completed' || order.actualReceivedQuantity) && (
                  <div className="p-3.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong>Weighment & Assay Verified:</strong> {order.actualReceivedQuantity || order.quantity} {order.actualQuantityUnit || order.unit} • {order.qualityGrade || 'Grade A'} • Assay: <strong>{order.assayResult || 'Passed'}</strong>
                      </span>
                    </div>
                    {order.payoutStatus === 'Released' && (
                      <span className="text-xs font-mono font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-[#bbf7d0]">
                        Payout Settled: ₹{(order.payoutAmount || order.totalAmount).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                )}

                {/* Workflow Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-border/70">
                  <div className="flex items-center gap-2 text-xs text-secondary">
                    <span className="font-semibold text-muted uppercase text-[11px]">Active Stage:</span>
                    <span className="font-bold text-main">
                      {isAwaitingFarmerConfirm && 'Awaiting Farmer Transport Confirmation'}
                      {canLockEscrow && 'Action Required: Lock Escrow Deposit'}
                      {canDispatch && 'Escrow Vault Secured — Ready to Dispatch Transport'}
                      {canMarkArrived && 'In Transit to Destination Hub'}
                      {canVerify && 'Arrived — Ready for Weighment & Quality Verification'}
                      {canReleasePayout && 'Dual Gatekeeper Verified — Ready for Payout'}
                      {isCompleted && '✓ Fully Settled & Completed'}
                      {order.status === 'Disputed' && '⚠️ Under Quality Dispute'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Stage 1: Waiting for Farmer to confirm transport */}
                    {isAwaitingFarmerConfirm && (
                      <span className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Awaiting Farmer Confirmation</span>
                      </span>
                    )}

                    {/* Stage 2: Buyer Step - Lock Escrow after Farmer confirms */}
                    {canLockEscrow && (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={lockingOrderId === order.id}
                        onClick={() => handleLockEscrow(order.id)}
                        className="bg-[#166534] hover:bg-[#14532d] flex items-center gap-1.5 shadow-card"
                      >
                        <Lock className="w-4 h-4 text-[#4ade80]" />
                        <span>{lockingOrderId === order.id ? 'Locking Escrow...' : 'Lock Escrow'}</span>
                      </Button>
                    )}

                    {/* Stage 3: Buyer Step - Dispatch / Start Transport */}
                    {canDispatch && (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={dispatchingOrderId === order.id}
                        onClick={() => handleDispatchTransport(order.id)}
                        className="bg-[#166534] hover:bg-[#14532d] flex items-center gap-1.5 shadow-card"
                      >
                        <Truck className="w-4 h-4 text-[#4ade80]" />
                        <span>{dispatchingOrderId === order.id ? 'Dispatching...' : 'Dispatch / Start Transport'}</span>
                      </Button>
                    )}

                    {/* Stage 4: Buyer Step - Mark Arrived */}
                    {canMarkArrived && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenModal(order, 'arrive')}
                        className="bg-[#166534] hover:bg-[#14532d] flex items-center gap-1.5 shadow-card"
                      >
                        <MapPin className="w-4 h-4 text-[#4ade80]" />
                        <span>Mark Arrived</span>
                      </Button>
                    )}

                    {/* Stage 5: Buyer Step - Verify Weight & Quality */}
                    {canVerify && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenModal(order, 'verify')}
                        className="bg-[#166534] hover:bg-[#14532d] flex items-center gap-1.5 shadow-card"
                      >
                        <Scale className="w-4 h-4 text-[#4ade80]" />
                        <span>Verify Weight & Quality</span>
                      </Button>
                    )}

                    {/* Stage 6: Buyer Step - Release Payout */}
                    {canReleasePayout && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenModal(order, 'payout')}
                        className="bg-[#166534] hover:bg-[#14532d] flex items-center gap-1.5 shadow-card"
                      >
                        <IndianRupee className="w-4 h-4 text-[#4ade80]" />
                        <span>Release Payout</span>
                      </Button>
                    )}

                    {/* Stage 7: Terminal Status - Completed (Display Only) */}
                    {isCompleted && (
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>Order Completed</span>
                      </span>
                    )}
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

      {/* Action Modals */}
      {selectedOrder && activeModal === 'arrive' && (
        <ShipmentArrivalModal
          order={selectedOrder}
          isOpen={true}
          onClose={handleCloseModal}
          onConfirm={async (remarks) => {
            await markOrderArrived(selectedOrder.id, remarks);
          }}
        />
      )}

      {selectedOrder && activeModal === 'verify' && (
        <QualityVerificationModal
          order={selectedOrder}
          isOpen={true}
          onClose={handleCloseModal}
          verifierName={currentBuyer.name}
          onVerify={async (data) => {
            await verifyOrderQuality(selectedOrder.id, data);
          }}
        />
      )}

      {selectedOrder && activeModal === 'payout' && (
        <ReleasePayoutModal
          order={selectedOrder}
          isOpen={true}
          onClose={handleCloseModal}
          onConfirm={async (notes) => {
            await releaseOrderPayout(selectedOrder.id, notes);
          }}
        />
      )}

    </div>
  );
};
