export type UserRole = 'farmer' | 'buyer';

export type QualityGrade = 'Grade A+' | 'Grade A' | 'Grade B' | 'Export Quality' | 'Standard';

export type ProduceStatus = 'Active' | 'Sold' | 'Expired' | 'Pending';

export type OrderStatus = 'Purchase Request' | 'Confirmed' | 'Transport Confirmed' | 'Escrow Locked' | 'In Transit' | 'Arrived' | 'Delivered' | 'Quality Verified' | 'Completed' | 'Rejected' | 'Disputed' | 'Cancelled';

export interface Farmer {
  id: string;
  name: string;
  farmName: string;
  location: string;
  state: string;
  rating: number;
  completedDeals: number;
  phone: string;
  isVerified: boolean;
  avatarUrl?: string;
  fpoMemberCount?: number;
}

export interface Buyer {
  id: string;
  name: string;
  companyName: string;
  companyType: 'FMCG' | 'Processor' | 'Exporter' | 'Retail Chain' | 'Wholesaler';
  location: string;
  state: string;
  isVerified: boolean;
  phone: string;
  gstNumber: string;
}

export interface ProduceListing {
  id: string;
  farmerId: string;
  farmerName: string;
  farmName: string;
  isFarmerVerified: boolean;
  crop: string;
  variety: string;
  category: 'Vegetables' | 'Grains' | 'Pulses' | 'Oilseeds' | 'Spices' | 'Cash Crops';
  quantity: number; // in quintals (or kg as specified)
  unit: 'quintal' | 'kg' | 'ton';
  expectedPrice: number; // in INR per unit
  marketReferencePrice: number; // in INR per unit
  location: string;
  quality: QualityGrade;
  harvestDate: string;
  deliveryOption: 'Farm-gate Pickup' | 'Direct Delivery' | 'Mandi Delivery' | 'Flexible';
  status: ProduceStatus;
  description: string;
  imageUrl: string;
  moisturePercentage?: number;
  createdDate: string;
}

export interface MarketPricePoint {
  id: string;
  crop: string;
  variety: string;
  mandi: string;
  state: string;
  currentPrice: number; // INR per quintal
  previousPrice: number;
  changePercent: number; // +8%, -2%
  highestPrice: number;
  lowestPrice: number;
  averagePrice: number;
  priceTrend: 'up' | 'down' | 'stable';
  historical30Days: { date: string; price: number; volumeMT: number }[];
  nearbyMarkets: {
    mandi: string;
    distanceKm: number;
    price: number;
    changePercent: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  insightSummary: string;
  recommendation: string;
}

export interface BuyerRequirement {
  id: string;
  buyerId: string;
  buyerName: string;
  companyName: string;
  isBuyerVerified: boolean;
  crop: string;
  variety: string;
  quantity: number;
  unit: 'quintal' | 'kg' | 'ton';
  targetPrice: number; // INR per unit
  qualityRequirements: QualityGrade;
  deliveryLocation: string;
  requiredByDate: string;
  paymentTerms: string;
  status: 'Open' | 'Fulfilled' | 'Closed';
  createdDate: string;
  matchingScore?: number; // 0 - 100%
  matchingReasons?: { label: string; isMatched: boolean }[];
}

export interface PurchaseRequest {
  id: string;
  produceId: string;
  cropName: string;
  buyerId: string;
  buyerName: string;
  buyerCompany: string;
  isBuyerVerified: boolean;
  farmerId: string;
  farmerName: string;
  requestedQuantity: number;
  unit: string;
  offeredPrice: number;
  deliveryLocation: string;
  requiredDate: string;
  message?: string;
  counterPrice?: number;
  counterQuantity?: number;
  counterMessage?: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Countered';
  createdDate: string;
}

export interface OrderItem {
  id: string;
  orderNumber: string; // e.g. FD-1042
  requestId?: string;
  produceId: string;
  crop: string;
  variety: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalAmount: number;
  farmerId: string;
  farmerName: string;
  farmerFarm: string;
  buyerId: string;
  buyerName: string;
  buyerCompany: string;
  deliveryLocation: string;
  orderDate: string;
  expectedDeliveryDate: string;
  status: OrderStatus;
  paymentStatus: 'Pending' | 'Escrow Locked' | 'Released' | 'Refunded' | 'Disputed';
  transportConfirmed?: boolean;
  transportConfirmedAt?: string;
  transportConfirmedBy?: string;
  arrivedAt?: string;
  arrivedBy?: string;
  arrivalRemarks?: string;
  actualReceivedQuantity?: number;
  actualQuantityUnit?: string;
  qualityGrade?: string;
  assayResult?: string;
  assayNotes?: string;
  verificationRemarks?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  payoutStatus?: string;
  payoutAmount?: number;
  payoutReleasedAt?: string;
  payoutReleasedBy?: string;
  payoutReference?: string;
  trackingSteps: {
    title: string;
    description: string;
    date?: string;
    completed: boolean;
    current: boolean;
  }[];
}

export interface ParsedSearchQuery {
  rawQuery: string;
  crop?: string;
  quantity?: number;
  unit?: string;
  quality?: string;
  location?: string;
  maxPrice?: number;
  minPrice?: number;
}

export interface AIAssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  content: string;
  structuredData?: {
    type: 'market_price' | 'produce_list' | 'buyer_matches' | 'order_summary' | 'requirement_preview';
    data: any;
  };
  suggestedActions?: string[];
}

export interface CropVariety {
  id: string;
  name: string;
  defaultGrade?: string;
  benchmarkPrice?: number;
  description?: string;
}

export interface CropItem {
  id: string;
  name: string;
  category: 'Vegetables' | 'Grains' | 'Pulses' | 'Oilseeds' | 'Spices' | 'Cash Crops';
  image: string;
  fallbackImage: string;
  defaultVariety: string;
  defaultPrice: number;
  varieties: CropVariety[];
  isActive: boolean;
}

