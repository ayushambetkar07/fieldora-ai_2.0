import React from 'react';
import { OrderItem } from '../../types';
import { Check, Clock, Truck, PackageCheck, AlertCircle } from 'lucide-react';
import { cn } from './index';

interface OrderTimelineProps {
  order: OrderItem;
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ order }) => {
  return (
    <div className="py-4 space-y-6">
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5EAE5]">
        {order.trackingSteps.map((step, idx) => {
          let dotBg = "bg-[#E5EAE5] text-muted border-border";
          let lineBg = "text-muted";

          if (step.completed) {
            dotBg = "bg-primary text-white border-primary";
            lineBg = "text-main font-semibold";
          } else if (step.current) {
            dotBg = "bg-accent text-white border-accent animate-pulse";
            lineBg = "text-accent font-semibold";
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
                  {step.date && <span className="text-[11px] text-muted font-mono">{step.date}</span>}
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
