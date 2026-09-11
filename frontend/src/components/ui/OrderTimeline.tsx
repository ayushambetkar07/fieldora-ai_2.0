import React from 'react';
import { OrderItem } from '../../types';
import { Check, ShieldCheck, Truck, Scale, CheckCircle2, PackageCheck } from 'lucide-react';
import { cn } from './index';

interface OrderTimelineProps {
  order: OrderItem;
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ order }) => {
  const isTransportConfirmed = order.status === 'Transport Confirmed' || order.transportConfirmed === true || ['Escrow Locked', 'In Transit', 'Arrived', 'Quality Verified', 'Completed'].includes(order.status);
  const isEscrowLocked = order.paymentStatus === 'Escrow Locked' || order.paymentStatus === 'Released' || ['In Transit', 'Arrived', 'Quality Verified', 'Completed'].includes(order.status);
  const isInTransit = ['In Transit', 'in_transit', 'Arrived', 'Quality Verified', 'Completed'].includes(order.status);
  const isArrived = ['Arrived', 'Quality Verified', 'Completed'].includes(order.status);
  const isQualityVerified = ['Quality Verified', 'Completed'].includes(order.status);
  const isCompleted = order.status === 'Completed' && (order.paymentStatus === 'Released' || order.payoutStatus === 'Released');

  const steps = [
    {
      title: '1. Deal Confirmed',
      description: 'Terms accepted by both parties. Contract generated.',
      date: order.orderDate || 'Confirmed',
      completed: true,
      current: order.status === 'Confirmed' && !order.transportConfirmed
    },
    {
      title: '2. Transport Confirmed (Farmer)',
      description: isTransportConfirmed 
        ? `Farmer (${order.farmerName}) confirmed transport readiness.`
        : 'Action required: Farmer must confirm transport readiness before escrow deposit.',
      date: isTransportConfirmed ? 'Confirmed' : undefined,
      completed: isTransportConfirmed,
      current: order.status === 'Confirmed' && !order.transportConfirmed
    },
    {
      title: '3. Smart Escrow Locked (Buyer)',
      description: isEscrowLocked 
        ? `Contract deposit of ₹${order.totalAmount.toLocaleString('en-IN')} secured in smart escrow vault.`
        : 'Buyer must deposit contract funds into simulated escrow vault.',
      date: isEscrowLocked ? 'Escrow Secured' : undefined,
      completed: isEscrowLocked,
      current: isTransportConfirmed && !isEscrowLocked
    },
    {
      title: '4. Logistics & In Transit (Buyer)',
      description: isInTransit
        ? 'Assigned carrier en route to destination delivery hub.'
        : 'Buyer initiates vehicle dispatch from farm-gate.',
      date: isInTransit ? 'In Transit' : undefined,
      completed: isInTransit,
      current: isEscrowLocked && !isInTransit
    },
    {
      title: '5. Arrival & Quality Verification (Buyer)',
      description: isQualityVerified
        ? `Verified: ${order.actualReceivedQuantity || order.quantity} ${order.actualQuantityUnit || order.unit} (${order.qualityGrade || 'Grade A'}) • Assay: ${order.assayResult || 'Passed'}.`
        : (isArrived ? 'Shipment arrived at hub. Ready for weighbridge & NABL assay inspection.' : 'Awaiting destination hub arrival and inspection.'),
      date: isQualityVerified ? 'Verified' : (isArrived ? 'Arrived' : undefined),
      completed: isQualityVerified,
      current: (isInTransit && !isArrived) || (isArrived && !isQualityVerified)
    },
    {
      title: '6. Smart Payout Released & Completed',
      description: isCompleted
        ? `₹${(order.payoutAmount || order.totalAmount).toLocaleString('en-IN')} disbursed to ${order.farmerName}. Ref: ${order.payoutReference || 'TX-SETTLED'}.`
        : 'Buyer authorizes escrow disbursement upon dual verification.',
      date: isCompleted ? 'Completed' : undefined,
      completed: isCompleted,
      current: isQualityVerified && !isCompleted
    }
  ];

  return (
    <div className="py-2 space-y-5">
      <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5EAE5]">
        {steps.map((step, idx) => {
          let dotBg = "bg-[#E5EAE5] text-muted border-border";
          let lineBg = "text-muted";

          if (step.completed) {
            dotBg = "bg-[#166534] text-white border-[#166534]";
            lineBg = "text-main font-semibold";
          } else if (step.current) {
            dotBg = "bg-[#d97706] text-white border-[#d97706] animate-pulse";
            lineBg = "text-[#b45309] font-bold";
          }

          return (
            <div key={idx} className="relative group">
              {/* Step indicator dot */}
              <div 
                className={cn(
                  "absolute -left-6 top-0.5 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] transition-colors",
                  dotBg
                )}
              >
                {step.completed ? (
                  <Check className="w-3 h-3 stroke-[3]" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              {/* Step details */}
              <div className="space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={cn("text-sm", lineBg)}>{step.title}</h4>
                  {step.date && <span className="text-[11px] text-muted font-mono bg-white px-2 py-0.5 rounded border border-border">{step.date}</span>}
                </div>
                <p className="text-xs text-secondary leading-relaxed">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
