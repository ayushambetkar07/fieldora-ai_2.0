import React from 'react';
import { TransportVehicle } from '../../types/transport';
import { 
  Truck, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Star, 
  Leaf, 
  Phone, 
  Check 
} from 'lucide-react';
import { cn } from '../ui';

interface VehicleSelectionCardProps {
  vehicle: TransportVehicle;
  orderWeightKg: number;
  routeDistanceKm: number;
  calculatedCost: number;
  isSelected: boolean;
  isRecommended: boolean;
  onSelect: (vehicle: TransportVehicle) => void;
}

export const VehicleSelectionCard: React.FC<VehicleSelectionCardProps> = ({
  vehicle,
  orderWeightKg,
  routeDistanceKm,
  calculatedCost,
  isSelected,
  isRecommended,
  onSelect
}) => {
  const isOverCapacity = orderWeightKg > vehicle.capacityKg;
  const capacityUsagePercent = Math.min(100, Math.round((orderWeightKg / vehicle.capacityKg) * 100));

  // Determine capacity color
  const getCapacityColor = () => {
    if (isOverCapacity) return 'bg-error text-error';
    if (capacityUsagePercent > 90) return 'bg-warning-dark text-warning-dark';
    return 'bg-primary text-primary';
  };

  return (
    <div
      onClick={() => !isOverCapacity && onSelect(vehicle)}
      className={cn(
        "relative rounded-card p-5 border transition-all duration-200 text-left cursor-pointer",
        isOverCapacity
          ? "bg-[#fafafa] border-[#e2e8f0] opacity-75 cursor-not-allowed"
          : isSelected
          ? "bg-[#F4F9F5] border-[#166534] ring-2 ring-[#166534]/20 shadow-md scale-[1.01]"
          : "bg-card border-border hover:border-[#166534]/50 hover:shadow-card"
      )}
    >
      
      {/* Top Badges */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {isRecommended && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#166534] text-white flex items-center gap-1 shadow-2xs">
              <Sparkles className="w-3 h-3 text-[#4ade80]" />
              <span>Recommended Choice</span>
            </span>
          )}
          {vehicle.isElectric && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#166534] border border-[#bbf7d0] flex items-center gap-1">
              <Leaf className="w-3 h-3 text-[#16a34a]" />
              <span>Zero Emission EV</span>
            </span>
          )}
        </div>

        {/* Selected Check Indicator */}
        <div className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center transition-colors shrink-0",
          isSelected 
            ? "bg-[#166534] text-white" 
            : isOverCapacity
            ? "bg-gray-200 text-gray-400"
            : "border border-border text-transparent"
        )}>
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </div>
      </div>

      {/* Vehicle Info Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <h3 className="font-heading font-bold text-base text-main leading-snug">
            {vehicle.name}
          </h3>
          <p className="text-xs text-secondary">
            Payload Capacity: <strong className="text-main font-mono">{vehicle.capacityKg.toLocaleString('en-IN')} kg</strong>
          </p>
        </div>

        {/* Pricing */}
        <div className="text-right">
          <div className="font-mono font-extrabold text-lg text-primary">
            ₹{calculatedCost.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-muted block">
            (₹{vehicle.perKmRate}/km + ₹{vehicle.baseCost} base)
          </span>
        </div>
      </div>

      {/* Payload Utilization Bar */}
      <div className="mt-4 space-y-1.5 bg-[#F7F9F6] p-2.5 rounded-input border border-border">
        <div className="flex items-center justify-between text-xs">
          <span className="text-secondary font-medium">
            Order Load: <strong>{orderWeightKg.toLocaleString('en-IN')} kg</strong>
          </span>
          <span className={cn("font-bold font-mono text-[11px]", isOverCapacity ? "text-error" : "text-primary")}>
            {isOverCapacity ? 'EXCEEDS CAPACITY' : `${capacityUsagePercent}% Loaded`}
          </span>
        </div>

        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", isOverCapacity ? "bg-error" : "bg-[#166534]")}
            style={{ width: `${Math.min(100, capacityUsagePercent)}%` }}
          />
        </div>
      </div>

      {/* Driver & Vehicle Details Footer */}
      <div className="mt-4 pt-3 border-t border-border/80 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {vehicle.driverAvatar ? (
            <img 
              src={vehicle.driverAvatar} 
              alt={vehicle.driverName} 
              className="w-7 h-7 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-[#EAEFEA] flex items-center justify-center font-bold text-primary text-[10px]">
              {vehicle.driverName.charAt(0)}
            </div>
          )}
          <div>
            <div className="font-bold text-main leading-tight text-xs flex items-center gap-1">
              <span>{vehicle.driverName}</span>
              <span className="text-[10px] text-amber-600 font-semibold flex items-center">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" /> {vehicle.rating}
              </span>
            </div>
            <span className="text-[10px] text-secondary font-mono">
              {vehicle.vehicleNumber}
            </span>
          </div>
        </div>

        {/* Status Pill */}
        {isOverCapacity ? (
          <span className="text-[11px] font-bold text-error flex items-center gap-1 bg-error-light px-2 py-0.5 rounded-full border border-[#fecaca]">
            <AlertTriangle className="w-3 h-3" /> Insufficient capacity
          </span>
        ) : (
          <span className="text-[11px] font-bold text-[#166534] flex items-center gap-1 bg-accent-light px-2 py-0.5 rounded-full border border-[#bbf7d0]">
            <CheckCircle2 className="w-3 h-3 text-accent" /> Available for Dispatch
          </span>
        )}
      </div>

      {/* Features tags */}
      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
        {vehicle.features.map((feat, idx) => (
          <span 
            key={idx} 
            className="text-[10px] bg-white border border-border text-secondary px-2 py-0.5 rounded-button"
          >
            {feat}
          </span>
        ))}
      </div>

    </div>
  );
};
