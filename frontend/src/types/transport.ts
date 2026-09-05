export type VehicleType = 'Pickup' | 'Tempo' | 'Mini Truck' | 'Heavy Truck' | 'EV Cargo';

export type VehicleAvailability = 'Available' | 'Busy' | 'Insufficient capacity';

export interface TransportVehicle {
  id: string;
  name: string;
  type: VehicleType;
  capacityKg: number;
  baseCost: number; // Flat baseline booking fee
  perKmRate: number; // ₹ per km
  availability: VehicleAvailability;
  rating: number;
  tripsCompleted: number;
  driverName: string;
  driverPhone: string;
  driverAvatar?: string;
  vehicleNumber: string;
  isElectric?: boolean;
  co2SavingsPercent?: number;
  dimensions: string; // e.g. "7ft x 4.5ft x 5ft"
  features: string[];
}

export interface RoadCoordinates {
  x: number; // For SVG visualization (0 - 800)
  y: number; // For SVG visualization (0 - 500)
  lat: number;
  lng: number;
}

export interface RoadNode {
  id: string;
  name: string;
  hindiName?: string;
  state: string;
  coordinates: RoadCoordinates;
  isFarmingHub?: boolean;
  isBuyerHub?: boolean;
  description?: string;
}

export type TrafficLevel = 'Low' | 'Moderate' | 'Heavy';

export interface RoadEdge {
  from: string;
  to: string;
  distanceKm: number;
  baseDurationMinutes: number;
  tollCost: number;
  trafficLevel: TrafficLevel;
  roadCondition: 'Expressway' | 'National Highway' | 'State Highway' | 'Rural Road';
  highwayCode?: string; // e.g. "NH-160", "Samruddhi Mahamarg"
}

export interface AStarCostWeights {
  distanceWeight: number; // weight multiplier for km (e.g. 1.0)
  timeWeight: number; // weight multiplier per minute (e.g. 1.5)
  trafficMultiplier: {
    Low: number;      // 1.0
    Moderate: number; // 1.3
    Heavy: number;    // 1.8
  };
  tollWeight: number; // weight multiplier for toll ₹ (e.g. 0.8)
}

export interface AStarStepLog {
  nodeId: string;
  nodeName: string;
  gScore: number; // Cost so far
  hScore: number; // Heuristic to goal
  fScore: number; // Total estimated cost
  parentName?: string;
}

export interface RouteOptimizationResult {
  id: string;
  name: string;
  highwaySummary: string;
  pathNodeIds: string[];
  pathNodes: RoadNode[];
  edges: RoadEdge[];
  totalDistanceKm: number;
  totalDurationMinutes: number;
  totalTollCost: number;
  overallTraffic: TrafficLevel;
  totalCostEstimate: number; // Base cost for standard vehicle
  weightedScore: number; // Final f(n)
  costBreakdown: {
    distanceCost: number;
    travelTimeCost: number;
    trafficPenaltyCost: number;
    tollCost: number;
  };
  isRecommended: boolean;
  tag: string; // e.g. "Fastest Direct (A*)", "Expressway Corridor", "Low Toll Route"
  description: string;
  aStarLogs?: AStarStepLog[];
}

export type TransportStatus = 
  | 'Vehicle Assigned'
  | 'Farmer Pickup'
  | 'In Transit'
  | 'Buyer Delivery'
  | 'Completed';

export interface TransportTrackingStep {
  status: TransportStatus;
  label: string;
  hindiLabel: string;
  description: string;
  timestamp?: string;
  completed: boolean;
  current: boolean;
  location?: string;
}

export interface TransportBooking {
  id: string;
  orderId?: string;
  orderNumber?: string;
  crop: string;
  quantity: number;
  unit: string;
  weightKg: number;
  pickupLocation: string;
  pickupNodeId: string;
  deliveryLocation: string;
  deliveryNodeId: string;
  deliveryDate: string;
  farmerName: string;
  farmerPhone: string;
  buyerName: string;
  buyerCompany: string;
  buyerPhone: string;
  selectedVehicle: TransportVehicle;
  selectedRoute: RouteOptimizationResult;
  totalTransportCost: number;
  status: TransportStatus;
  currentProgressPercent: number;
  currentCheckpoint: string;
  eta: string;
  currentSpeedKmH: number;
  temperatureControlled: boolean;
  weighbridgeAssayVerified: boolean;
  trackingSteps: TransportTrackingStep[];
  createdDate: string;
}
