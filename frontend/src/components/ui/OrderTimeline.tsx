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
      title: '1. Deal Agreed & Order Confirmed',
      description: 'Terms accepted by both parties. Legally binding digital contract generated.',
      date: order.orderDate || 'Confirmed',
      completed: true,
      current: order.status === 'Confirmed' && !order.transportConfirmed
    },
    {
      title: '2. Transport Readiness Confirmed (Farmer)',
      description: isTransportConfirmed 
        ? `Farmer (${order.farmerName}) confirmed lot ready for farm-gate dispatch.`
        : 'Action required: Farmer must confirm crop lot readiness before buyer locks escrow.',
      date: isTransportConfirmed ? 'Confirmed' : undefined,
      completed: isTransportConfirmed,
      current: order.status === 'Confirmed' && !order.transportConfirmed
    },
    {
      title: '3. Smart Escrow Deposit Secured (Buyer)',
      description: isEscrowLocked 
        ? `Contract deposit of ₹${order.totalAmount.toLocaleString('en-IN')} locked safely in escrow vault.`
        : 'Buyer locks contract funds into smart escrow before transport assignment.',
      date: isEscrowLocked ? 'Escrow Locked' : undefined,
      completed: isEscrowLocked,
      current: isTransportConfirmed && !isEscrowLocked
    },
    {
      title: '4. Vehicle Assigned & Dispatched (A* Optimized)',
      description: isInTransit
        ? 'Assigned carrier en route from farm origin to destination APMC hub.'
        : 'Direct transport booked and vehicle dispatched.',
      date: isInTransit ? 'Dispatched' : undefined,
      completed: isInTransit,
      current: isEscrowLocked && !isInTransit
    },
    {
      title: '5. In Transit & Live GPS Telemetry',
      description: isArrived
        ? 'Highway transit completed along optimized corridor.'
        : (isInTransit ? 'Vehicle in transit with real-time GPS telemetry and checkpoint updates.' : 'Awaiting transit start.'),
      date: isArrived ? 'Transit Done' : (isInTransit ? 'In Transit' : undefined),
      completed: isArrived,
      current: isInTransit && !isArrived
    },
    {
      title: '6. Destination Arrival at Delivery Hub',
      description: isArrived
        ? (order.arrivedBy ? `Arrived and logged by ${order.arrivedBy}.` : 'Shipment arrived at destination facility.')
        : 'Awaiting arrival at destination APMC mandi hub.',
      date: isArrived ? 'Arrived' : undefined,
      completed: isArrived,
      current: isInTransit && !isArrived
    },
    {
      title: '7. Dual Weighbridge & NABL Quality Verification',
      description: isQualityVerified
        ? `Verified: ${order.actualReceivedQuantity || order.quantity} ${order.actualQuantityUnit || order.unit} (${order.qualityGrade || 'Grade A'}) • NABL Assay: ${order.assayResult || 'Passed'}.`
        : (isArrived ? 'Ready for automated weighbridge gross/tare and on-site NABL assay certification.' : 'Awaiting destination inspection.'),
      date: isQualityVerified ? 'Verified' : undefined,
      completed: isQualityVerified,
      current: isArrived && !isQualityVerified
    },
    {
      title: '8. Smart Escrow Released & Farmer Paid',
      description: isCompleted
        ? `Payout of ₹${(order.payoutAmount || order.totalAmount).toLocaleString('en-IN')} disbursed to ${order.farmerName}. Ref: ${order.payoutReference || 'TX-SETTLED'}.`
        : 'Smart contract disburses farmer payout upon dual assay & weighment verification.',
      date: isCompleted ? 'Settled' : undefined,
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
