import React, { useState, useEffect } from 'react';
import { 
  TransportBooking, 
  TransportStatus 
} from '../../types/transport';
import { 
  CheckCircle2, 
  Clock, 
  Truck, 
  MapPin, 
  Phone, 
  MessageSquare, 
  ShieldCheck, 
  Scale, 
  FileText, 
  Navigation, 
  Sparkles, 
  ArrowRight, 
  Play, 
  RotateCcw,
  Check
} from 'lucide-react';
import { Button, Card, Badge, cn } from '../ui';
import { useApp } from '../../context/AppContext';

interface TransportTrackerProps {
  booking: TransportBooking;
  onUpdateStatus?: (newStatus: TransportStatus, progress: number) => void;
  onSimulateFullTrip?: () => void;
  isSimulatingLive?: boolean;
}

export const TransportTracker: React.FC<TransportTrackerProps> = ({
  booking,
  onUpdateStatus,
  onSimulateFullTrip,
  isSimulatingLive = false
}) => {
  const { userRole } = useApp();
  const steps: { status: TransportStatus; label: string; hindiLabel: string; desc: string }[] = [
    {
      status: 'Vehicle Assigned',
      label: 'Vehicle Assigned',
      hindiLabel: 'वाहन आवंटित किया गया',
      desc: `Assigned ${booking.selectedVehicle.name} (${booking.selectedVehicle.vehicleNumber}). Driver notified.`
    },
    {
      status: 'Farmer Pickup',
      label: 'Farmer Farm-Gate Pickup',
      hindiLabel: 'किसान के खेत से लोडिंग',
      desc: `Arrived at ${booking.pickupLocation}. Quality check & weighbridge tare measured.`
    },
    {
      status: 'In Transit',
      label: 'In Direct Transit',
      hindiLabel: 'सीधा पारगमन में',
      desc: `Direct non-stop transit via ${booking.selectedRoute.highwaySummary}. Zero warehouse delay.`
    },
    {
      status: 'Buyer Delivery',
      label: 'Buyer Delivery & Inspection',
      hindiLabel: 'खरीदार डिलीवरी व सत्यापन',
      desc: `Delivered to ${booking.deliveryLocation}. Assay verified & electronic escrow release triggered.`
    }
  ];

  const getStepIndex = (status: TransportStatus): number => {
    switch (status) {
      case 'Vehicle Assigned': return 0;
      case 'Farmer Pickup': return 1;
      case 'In Transit': return 2;
      case 'Buyer Delivery':
      case 'Completed': return 3;
      default: return 0;
    }
  };

  const currentIndex = getStepIndex(booking.status);

  // Advance to next milestone
  const handleAdvanceStep = () => {
    if (currentIndex < 3) {
      const nextStatus = steps[currentIndex + 1].status;
      const nextProgress = Math.min(100, Math.round(((currentIndex + 1) / 3) * 100));
      if (onUpdateStatus) {
        onUpdateStatus(nextStatus, nextProgress);
      }
    }
  };

  const handleReset = () => {
    if (onUpdateStatus) {
      onUpdateStatus('Vehicle Assigned', 10);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. Header & Live Telemetry Card */}
      <div className="bg-[#0f2314] text-white p-5 sm:p-6 rounded-card border border-[#1b3e23] shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1b3e23] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-accent-light text-sm">
                Shipment #{booking.id}
              </span>
              <Badge variant="success" className="bg-[#166534] text-white border-0 shadow-2xs">
                <Truck className="w-3 h-3 text-[#4ade80] inline mr-1" />
                Direct Farm ➔ Buyer
              </Badge>
              <span className="text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 px-2 py-0.5 rounded-full font-mono">
                Direct Optimal Route
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-white">
              {booking.crop} Direct Dispatch ({booking.quantity} {booking.unit}s)
            </h2>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">
              Live Estimated Arrival (ETA)
            </span>
            <span className="text-2xl font-bold font-mono text-white flex items-center sm:justify-end gap-1.5 text-accent-light">
              <Clock className="w-5 h-5 text-accent" /> {booking.eta}
            </span>
          </div>
        </div>

        {/* Real-time Telemetry Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
          <div className="bg-[#08170c] p-3 rounded-input border border-[#1b3e23]/80">
            <span className="text-gray-400 block text-[11px]">Current Speed</span>
            <span className="font-bold text-white font-mono text-sm">
              {booking.status === 'In Transit' ? '58 km/h' : '0 km/h (At Hub)'}
            </span>
          </div>

          <div className="bg-[#08170c] p-3 rounded-input border border-[#1b3e23]/80">
            <span className="text-gray-400 block text-[11px]">Next Checkpoint</span>
            <span className="font-bold text-accent-light truncate block">
              {booking.currentCheckpoint || 'Igatpuri Pass'}
            </span>
          </div>

          <div className="bg-[#08170c] p-3 rounded-input border border-[#1b3e23]/80">
            <span className="text-gray-400 block text-[11px]">Transport Fee</span>
            <span className="font-bold text-white font-mono text-sm">
              ₹{booking.totalTransportCost.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-[#08170c] p-3 rounded-input border border-[#1b3e23]/80">
            <span className="text-gray-400 block text-[11px]">Quality Escrow</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Protected
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs text-gray-300">
            <span>Route Progress</span>
            <span className="font-mono font-bold text-accent-light">{booking.currentProgressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-[#08170c] rounded-full overflow-hidden border border-[#1b3e23]">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 via-green-500 to-[#4ade80] rounded-full transition-all duration-700 shadow-sm"
              style={{ width: `${booking.currentProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Four-Step Milestone Flow (Farmer -> Vehicle -> Transit -> Buyer) */}
      <Card className="p-6 space-y-6">
        <div>
          <h3 className="text-base font-bold text-main font-heading">
            Direct Delivery Journey Milestones
          </h3>
          <p className="text-xs text-secondary">
            Continuous GPS verification and automated weighbridge validation at each stage.
          </p>
        </div>

        <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#EAEFEA]">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isUpcoming = idx > currentIndex;

            return (
              <div key={step.status} className="relative flex items-start gap-4">
                
                {/* Milestone Node Pin */}
                <div className={cn(
                  "absolute -left-6 sm:-left-8 w-6 sm:w-8 h-6 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all",
                  isCompleted
                    ? "bg-[#166534] text-white ring-4 ring-white"
                    : isCurrent
                    ? "bg-accent text-white ring-4 ring-accent-light animate-pulse"
                    : "bg-[#EAEFEA] text-secondary border border-border"
                )}>
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Milestone Content */}
                <div className={cn(
                  "p-4 rounded-input border w-full transition-all",
                  isCurrent 
                    ? "bg-[#F4F9F5] border-[#166534]/50 shadow-xs" 
                    : isCompleted
                    ? "bg-white border-border/80"
                    : "bg-[#fafafa] border-dashed border-border text-muted"
                )}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-bold text-sm",
                        isCurrent ? "text-primary" : isCompleted ? "text-main" : "text-secondary"
                      )}>
                        {step.label}
                      </span>
                      <span className="text-[10px] text-secondary font-semibold hidden sm:inline">
                        ({step.hindiLabel})
                      </span>
                    </div>

                    {isCurrent && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-[#E8F3EB] px-2 py-0.5 rounded-full self-start">
                        Active Stage
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-[10px] font-semibold text-accent flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-secondary mt-1">
                    {step.desc}
                  </p>

                  {/* Stage-specific micro UI */}
                  {step.status === 'Farmer Pickup' && isCompleted && (
                    <div className="mt-3 p-2 bg-[#FAFCFA] border border-border rounded flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-main font-semibold">
                        <Scale className="w-3.5 h-3.5 text-primary" />
                        <span>Farm-gate Gross Tare: {booking.weightKg} kg (NABL Calibrated)</span>
                      </div>
                      <span className="text-accent font-bold">✓ Verified</span>
                    </div>
                  )}

                  {step.status === 'In Transit' && isCurrent && (
                    <div className="mt-3 p-2.5 bg-white border border-[#166534]/30 rounded-input flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-primary animate-bounce" />
                        <span className="font-semibold text-main">
                          Passing checkpost: <strong>{booking.currentCheckpoint}</strong>
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-primary font-bold">
                        ETA 45 mins
                      </span>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {/* Milestone Control Actions */}
        <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset Simulation
            </Button>
            {onSimulateFullTrip && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onSimulateFullTrip}
                className="text-xs"
              >
                <Play className="w-3.5 h-3.5 mr-1 text-primary" /> Simulate Continuous Transit
              </Button>
            )}
          </div>

          {userRole === 'buyer' ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#166534] bg-[#E8F3EB] border border-[#bbf7d0] px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                <span>Live Status: {steps[currentIndex]?.label}</span>
              </span>
            </div>
          ) : (
            currentIndex < 3 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleAdvanceStep}
                className="text-xs shadow-card"
              >
                <span>Advance to Next Step ({steps[currentIndex + 1]?.label.split(' ')[0]})</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            ) : (
              <span className="text-xs font-bold text-accent flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Order Fully Delivered & Completed!
              </span>
            )
          )}
        </div>
      </Card>

      {/* 3. Driver & Vehicle Profile Card */}
      <Card className="p-5 border-border bg-[#FAFCFA]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3.5">
            {booking.selectedVehicle.driverAvatar ? (
              <img
                src={booking.selectedVehicle.driverAvatar}
                alt={booking.selectedVehicle.driverName}
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#166534] text-white flex items-center justify-center font-bold text-sm">
                {booking.selectedVehicle.driverName.charAt(0)}
              </div>
            )}

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-main text-sm">
                  {booking.selectedVehicle.driverName}
                </h4>
                <Badge variant="success" className="text-[10px] py-0">Verified Driver</Badge>
              </div>
              <p className="text-xs text-secondary">
                {booking.selectedVehicle.name} • <strong className="font-mono text-main">{booking.selectedVehicle.vehicleNumber}</strong>
              </p>
              <div className="text-[11px] text-muted flex items-center gap-3">
                <span>⭐ {booking.selectedVehicle.rating} Rating</span>
                <span>• {booking.selectedVehicle.tripsCompleted} Trips</span>
              </div>
            </div>
          </div>

          {/* Quick Communication Buttons */}
          <div className="flex items-center gap-2">
            <a
              href={`tel:${booking.selectedVehicle.driverPhone}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-border text-xs font-semibold rounded-button text-main hover:bg-[#EAEFEA] transition-colors shadow-2xs"
            >
              <Phone className="w-3.5 h-3.5 text-primary" />
              <span>Call Driver</span>
            </a>
            <a
              href={`https://wa.me/${booking.selectedVehicle.driverPhone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#166534] text-white text-xs font-semibold rounded-button hover:bg-[#14532d] transition-colors shadow-card"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#4ade80]" />
              <span>WhatsApp</span>
            </a>
          </div>

        </div>
      </Card>

    </div>
  );
};
