import React from 'react';
import { Card, Badge, cn } from './index';
import { ProduceListing, BuyerRequirement } from '../../types';
import { 
  MapPin, 
  Scale, 
  BadgeCheck, 
  IndianRupee, 
  CalendarDays, 
  Truck, 
  Eye, 
  Send, 
  TrendingUp, 
  TrendingDown,
  Wheat,
  Sparkles,
  ArrowRight,
  User
} from 'lucide-react';
import { Link } from 'react-router-dom';

// 1. StatCard
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  isPositive?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  iconBgColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  change,
  isPositive = true,
  icon: Icon,
  iconColor = "text-primary",
  iconBgColor = "bg-primary-light"
}) => {
  return (
    <div className="ref-card p-5 space-y-3 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-secondary">{title}</span>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconBgColor, iconColor)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div>
        <div className="text-3xl font-heading font-extrabold text-main tracking-tight font-mono">{value}</div>
        {(subtitle || change) && (
          <div className="flex items-center gap-1.5 mt-1 text-xs text-secondary">
            {change && (
              <span className={cn("font-bold inline-flex items-center", isPositive ? "text-accent" : "text-error")}>
                {isPositive ? <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> : <TrendingDown className="w-3.5 h-3.5 mr-0.5" />}
                {change}
              </span>
            )}
            {subtitle && <span>{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

// 2. ProduceCard (Exact matching to Reference Image)
interface ProduceCardProps {
  produce: ProduceListing;
  onContact?: (produce: ProduceListing) => void;
  showActions?: boolean;
}

export const ProduceCard: React.FC<ProduceCardProps> = ({ produce, onContact, showActions = true }) => {
  return (
    <div className="ref-card overflow-hidden flex flex-col justify-between group">
      <div>
        {/* Produce Image with Badges */}
        <div className="relative h-44 w-full bg-[#EAEFEA] overflow-hidden">
          <img 
            src={produce.imageUrl} 
            alt={produce.crop} 
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
            {produce.isFarmerVerified && (
              <span className="px-2.5 py-0.5 bg-[#22C55E] text-white text-[10px] font-bold rounded-full shadow-xs flex items-center gap-1">
                <BadgeCheck className="w-3 h-3" /> Verified Farmer
              </span>
            )}
            {produce.status === 'Pending' && (
              <span className="px-2.5 py-0.5 bg-[#F59E0B] text-white text-[10px] font-bold rounded-full shadow-xs">
                Pending
              </span>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-2.5">
          {/* Crop Title & Price Row */}
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-heading font-extrabold text-base text-main leading-tight">
              {produce.crop}
            </h3>
            <div className="text-right">
              <span className="text-sm font-extrabold font-mono text-main">
                ₹{produce.expectedPrice.toLocaleString('en-IN')}<span className="text-xs font-normal text-secondary">/{produce.unit === 'quintal' ? 'q' : produce.unit}</span>
              </span>
            </div>
          </div>

          <div className="text-xs text-secondary">
            <span>Available unit: <strong>{produce.quantity} {produce.unit}s</strong></span>
          </div>

          {/* Location with Icon */}
          <div className="flex items-center gap-1.5 text-xs text-secondary">
            <MapPin className="w-3.5 h-3.5 text-muted shrink-0" />
            <span className="truncate">{produce.location}</span>
          </div>

          {/* Farmer Avatar & Verification */}
          <div className="flex items-center gap-2 pt-2 border-t border-[#EAEFEA]">
            <div className="w-7 h-7 rounded-full bg-primary-light text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
              {produce.farmerName.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-main truncate leading-none">
                {produce.farmerName}
              </div>
              <span className="text-[10px] text-primary font-semibold block mt-0.5">
                Verified Farmer
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Orange Action Button from Reference */}
      {showActions && (
        <div className="p-4 pt-1">
          <Link to={`/buyer/produce/${produce.id}`} className="block w-full">
            <button className="w-full py-2.5 btn-orange text-xs font-bold rounded-input flex items-center justify-center gap-1.5">
              <span>View Details</span>
            </button>
          </Link>
        </div>
      )}
    </div>
  );
};

// 3. RequirementCard
interface RequirementCardProps {
  requirement: BuyerRequirement;
  onRespond?: (req: BuyerRequirement) => void;
  showSmartMatch?: boolean;
}

export const RequirementCard: React.FC<RequirementCardProps> = ({ requirement, onRespond, showSmartMatch = false }) => {
  return (
    <div className="ref-card p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-heading font-extrabold text-base text-main">{requirement.companyName}</span>
            {requirement.isBuyerVerified && (
              <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 bg-[#dcfce7] text-[#166534] text-[11px] font-bold rounded-full border border-[#bbf7d0]">
                <BadgeCheck className="w-3 h-3 text-[#22C55E]" /> Verified Buyer
              </span>
            )}
          </div>
          <p className="text-xs text-secondary mt-0.5">Posted by {requirement.buyerName} • Required by {requirement.requiredByDate}</p>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] text-muted block uppercase font-extrabold">Target Rate</span>
          <span className="text-xl font-bold text-primary font-mono">
            ₹{requirement.targetPrice.toLocaleString('en-IN')}/q
          </span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-[#F7F8F3] p-3 rounded-input border border-[#EAEFEA]">
        <div>
          <span className="text-muted block text-[11px]">Commodity</span>
          <span className="font-bold text-main">{requirement.crop} ({requirement.variety})</span>
        </div>
        <div>
          <span className="text-muted block text-[11px]">Quantity Required</span>
          <span className="font-bold text-main">{requirement.quantity} {requirement.unit}s</span>
        </div>
        <div>
          <span className="text-muted block text-[11px]">Quality Grade</span>
          <span className="font-bold text-main">{requirement.qualityRequirements}</span>
        </div>
        <div>
          <span className="text-muted block text-[11px]">Delivery Location</span>
          <span className="font-bold text-main truncate block">{requirement.deliveryLocation}</span>
        </div>
      </div>

      {/* Smart Match Display */}
      {showSmartMatch && requirement.matchingScore && (
        <div className="bg-[#E8F3EB] border border-[#bbf7d0] p-3.5 rounded-input space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-main">
            <span className="flex items-center gap-1 text-primary">
              <Sparkles className="w-3.5 h-3.5 text-[#22C55E]" /> Smart Match Compatibility
            </span>
            <span className="text-primary font-mono font-extrabold text-sm">{requirement.matchingScore}% Match</span>
          </div>
          <div className="w-full bg-[#bbf7d0] h-2 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full rounded-full transition-all duration-500" 
              style={{ width: `${requirement.matchingScore}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-[#EAEFEA]">
        <span className="text-xs text-secondary truncate max-w-[60%]">
          Terms: <strong>{requirement.paymentTerms}</strong>
        </span>
        <button
          onClick={() => onRespond?.(requirement)}
          className="px-4 py-2 btn-orange text-xs font-bold rounded-input flex items-center gap-1.5 shadow-xs"
        >
          <span>Respond with Offer</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
