/**
 * Fieldora Smart Direct Transport & Route Optimization Service
 */
import { supabase } from '../config/supabase.js';
import { calculateDistanceKm } from './distanceService.js';

export type AvailabilityStatus = 'Available' | 'Busy' | 'Maintenance';

export interface TransportVehicleRecord {
  id: string;
  vehicleName: string;
  vehicleType: string;
  capacityKg: number;
  baseCost: number;
  ratePerKm: number;
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  availabilityStatus: AvailabilityStatus;
  rating?: number;
  tripsCompleted?: number;
}

export interface TransportOption {
  id: string;
  vehicleName: string;
  vehicleType: string;
  capacityKg: number;
  currentLoadKg: number;
  loadingPercentage: number;
  estimatedFreight: number;
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  availabilityStatus: AvailabilityStatus;
  distanceKm: number;
  estimatedTime: string;
  matchScore: number;
  isBestMatch: boolean;
  isSuitable: boolean;
  scoreBreakdown: {
    capacityScore: number;
    freightScore: number;
    availabilityScore: number;
    routeScore: number;
  };
}

export interface TransportOptionsRequest {
  pickupLocation: string;
  destination: string;
  crop?: string;
  quantity?: number;
  quantityKg?: number;
  unit?: string;
}

export interface TransportOptionsResponse {
  options: TransportOption[];
  suitableCount: number;
  totalAvailable: number;
  pickupLocation: string;
  destination: string;
  distanceKm: number;
  estimatedTime: string;
  crop: string;
  requestedQuantityKg: number;
  dataSource: 'database' | 'seed_demo';
}

// Unit to KG normalization
export const UNIT_TO_KG: Record<string, number> = {
  kg: 1,
  kilogram: 1,
  quintal: 100,
  q: 100,
  ton: 1000,
  tonne: 1000,
  mt: 1000,
  crate: 20,
  bag: 50,
  sack: 50
};

export function normalizeQuantityToKg(quantity: number, unit: string = 'kg'): number {
  if (!quantity || quantity <= 0) return 0;
  const multiplier = UNIT_TO_KG[unit.toLowerCase().trim()] || 1;
  return Math.round(quantity * multiplier);
}

// Seed / Demo operational fleet (Maharashtra corridor)
export const SEED_TRANSPORT_VEHICLES: TransportVehicleRecord[] = [
  {
    id: 'veh-tata-ace-01',
    vehicleName: 'Tata Ace Gold',
    vehicleType: 'Tempo',
    capacityKg: 1000,
    baseCost: 300,
    ratePerKm: 14.5,
    driverName: 'Suresh More',
    driverPhone: '+919822144550',
    vehicleNumber: 'MH-15-EG-4412',
    availabilityStatus: 'Available',
    rating: 4.9,
    tripsCompleted: 142
  },
  {
    id: 'veh-bolero-maxi-02',
    vehicleName: 'Bolero Maxi Truck',
    vehicleType: 'Mini Truck',
    capacityKg: 1500,
    baseCost: 400,
    ratePerKm: 18.0,
    driverName: 'Balasaheb Shinde',
    driverPhone: '+919822144551',
    vehicleNumber: 'MH-15-BT-8901',
    availabilityStatus: 'Available',
    rating: 4.8,
    tripsCompleted: 98
  },
  {
    id: 'veh-mahindra-jeeto-03',
    vehicleName: 'Mahindra Jeeto',
    vehicleType: 'Mini Truck',
    capacityKg: 700,
    baseCost: 250,
    ratePerKm: 12.5,
    driverName: 'Rahul Patil',
    driverPhone: '+919822144552',
    vehicleNumber: 'MH-15-KQ-6274',
    availabilityStatus: 'Available',
    rating: 4.7,
    tripsCompleted: 64
  },
  {
    id: 'veh-tata-407-04',
    vehicleName: 'Tata 407',
    vehicleType: 'Light Commercial Truck',
    capacityKg: 2500,
    baseCost: 600,
    ratePerKm: 22.0,
    driverName: 'Amit Jadhav',
    driverPhone: '+919822144553',
    vehicleNumber: 'MH-15-CR-3158',
    availabilityStatus: 'Available',
    rating: 4.9,
    tripsCompleted: 215
  },
  {
    id: 'veh-ashok-leyland-05',
    vehicleName: 'Ashok Leyland Dost',
    vehicleType: 'Light Commercial Vehicle',
    capacityKg: 1500,
    baseCost: 400,
    ratePerKm: 18.0,
    driverName: 'Nitin Pawar',
    driverPhone: '+919822144554',
    vehicleNumber: 'MH-15-HL-7286',
    availabilityStatus: 'Busy',
    rating: 4.6,
    tripsCompleted: 87
  }
];

/**
 * Fetch transport fleet records from Supabase with graceful fallback to seed dataset.
 */
export async function getTransportFleet(): Promise<{ fleet: TransportVehicleRecord[]; dataSource: 'database' | 'seed_demo' }> {
  try {
    const { data, error } = await supabase
      .from('transport_vehicles')
      .select('*')
      .order('capacity_kg', { ascending: true });

    if (!error && data && data.length > 0) {
      const fleet: TransportVehicleRecord[] = data.map((d: any) => ({
        id: d.id || d.vehicle_id,
        vehicleName: d.vehicle_name || d.name,
        vehicleType: d.vehicle_type || d.type,
        capacityKg: Number(d.capacity_kg || d.capacityKg),
        baseCost: Number(d.base_cost || d.baseCost || 300),
        ratePerKm: Number(d.rate_per_km || d.ratePerKm || 15),
        driverName: d.driver_name || d.driverName,
        driverPhone: d.driver_phone || d.driverPhone || '+919822100000',
        vehicleNumber: d.vehicle_number || d.vehicleNumber,
        availabilityStatus: (d.availability_status || d.status || 'Available') as AvailabilityStatus,
        rating: Number(d.rating || 4.8),
        tripsCompleted: Number(d.trips_completed || 50)
      }));
      return { fleet, dataSource: 'database' };
    }
  } catch (err) {
    // Database table not available yet, fall through to seed fleet
  }

  return { fleet: SEED_TRANSPORT_VEHICLES, dataSource: 'seed_demo' };
}

/**
 * Format duration text from distance in km.
 */
export function estimateTravelTime(distanceKm: number): string {
  if (distanceKm <= 30) return '45 min - 1 hour';
  if (distanceKm <= 75) return '1.5 - 2 hours';
  if (distanceKm <= 170) return '4 - 5 hours';
  if (distanceKm <= 220) return '5 - 6 hours';
  if (distanceKm <= 350) return '7 - 9 hours';
  const minHours = Math.round(distanceKm / 45);
  const maxHours = Math.round(distanceKm / 38);
  return `${minHours} - ${maxHours} hours`;
}

/**
 * Calculate deterministic match score for a vehicle given payload and route.
 * Weights:
 * - Capacity suitability: 40%
 * - Freight efficiency: 30%
 * - Availability: 20%
 * - Route / Time efficiency: 10%
 */
export function calculateMatchScore(
  vehicle: TransportVehicleRecord,
  quantityKg: number,
  distanceKm: number,
  estimatedFreight: number
): { matchScore: number; isSuitable: boolean; scoreBreakdown: TransportOption['scoreBreakdown'] } {
  const isSuitable = vehicle.capacityKg >= quantityKg;

  // 1. Capacity Suitability (40%)
  // Ideal loading is 75% - 92% of payload capacity
  let capacityScore = 0;
  if (!isSuitable) {
    capacityScore = 0;
  } else {
    const loadPct = (quantityKg / vehicle.capacityKg) * 100;
    if (loadPct >= 75 && loadPct <= 92) {
      capacityScore = 100;
    } else if (loadPct < 75) {
      // Under-utilized: penalize oversized trucks transporting tiny loads
      capacityScore = Math.max(20, Math.round(100 - (75 - loadPct) * 1.1));
    } else {
      // 93% - 100%: near capacity limit
      capacityScore = Math.max(75, Math.round(100 - (loadPct - 92) * 2.5));
    }
  }

  // 2. Freight Efficiency (30%)
  // Calculate cost per ton-km
  let freightScore = 0;
  if (isSuitable && quantityKg > 0 && distanceKm > 0) {
    const costPerKg = estimatedFreight / quantityKg;
    // Benchmark ₹2.0 - ₹3.5 per kg for 150-200km transit
    if (costPerKg <= 3.0) {
      freightScore = 100;
    } else if (costPerKg <= 4.0) {
      freightScore = Math.max(50, Math.round(100 - (costPerKg - 3.0) * 30));
    } else {
      freightScore = Math.max(20, Math.round(70 - (costPerKg - 4.0) * 15));
    }
  } else {
    freightScore = 10;
  }

  // 3. Availability (20%)
  const availabilityScore = vehicle.availabilityStatus === 'Available' ? 100 : 0;

  // 4. Route / Time efficiency (10%)
  // Commercial trucks have established clearance on National/State highway corridors
  let routeScore = 90;
  if (vehicle.vehicleType === 'Tempo') routeScore = 95; // highly agile for urban APMCs
  if (vehicle.vehicleType === 'Mini Truck') routeScore = 92;
  if (vehicle.vehicleType === 'Light Commercial Truck') routeScore = 88;

  // Final Weighted Deterministic Score
  const matchScore = isSuitable
    ? Math.min(100, Math.max(0, Math.round(
        capacityScore * 0.40 +
        freightScore * 0.30 +
        availabilityScore * 0.20 +
        routeScore * 0.10
      )))
    : 0;

  return {
    matchScore,
    isSuitable,
    scoreBreakdown: {
      capacityScore,
      freightScore,
      availabilityScore,
      routeScore
    }
  };
}

/**
 * Core function to query and rank dynamic transport options.
 */
export async function getDynamicTransportOptions(
  params: TransportOptionsRequest
): Promise<TransportOptionsResponse> {
  const pickup = params.pickupLocation || 'Nashik';
  const destination = params.destination || 'Mumbai';
  const crop = params.crop || 'Produce';
  
  // Normalize quantity to KG
  const rawQty = params.quantityKg !== undefined ? params.quantityKg : (params.quantity || 800);
  const unit = params.unit || 'kg';
  const quantityKg = params.quantityKg !== undefined ? Math.round(params.quantityKg) : normalizeQuantityToKg(rawQty, unit);

  // Calculate corridor distance & estimated travel time
  const distanceKm = calculateDistanceKm(pickup, destination);
  const estimatedTime = estimateTravelTime(distanceKm);

  // Fetch transport fleet
  const { fleet, dataSource } = await getTransportFleet();

  // Map each vehicle to dynamic TransportOption
  const options: TransportOption[] = fleet.map(veh => {
    const loadingPercentage = veh.capacityKg > 0 
      ? Math.min(100, Math.round((quantityKg / veh.capacityKg) * 100))
      : 0;

    // Calculate dynamic freight: base + (rate * distance), rounded to nearest ₹50
    const rawFreight = veh.baseCost + (veh.ratePerKm * distanceKm);
    const estimatedFreight = Math.max(1200, Math.round(rawFreight / 50) * 50);

    const { matchScore, isSuitable, scoreBreakdown } = calculateMatchScore(
      veh,
      quantityKg,
      distanceKm,
      estimatedFreight
    );

    return {
      id: veh.id,
      vehicleName: veh.vehicleName,
      vehicleType: veh.vehicleType,
      capacityKg: veh.capacityKg,
      currentLoadKg: quantityKg,
      loadingPercentage,
      estimatedFreight,
      driverName: veh.driverName,
      driverPhone: veh.driverPhone,
      vehicleNumber: veh.vehicleNumber,
      availabilityStatus: veh.availabilityStatus,
      distanceKm,
      estimatedTime,
      matchScore,
      isBestMatch: false, // will assign to top suitable below
      isSuitable,
      scoreBreakdown
    };
  });

  // Rank transport options:
  // 1. Suitable vehicles first
  // 2. Available status first
  // 3. Match score descending
  // 4. Lowest freight cost ascending
  options.sort((a, b) => {
    if (a.isSuitable !== b.isSuitable) return a.isSuitable ? -1 : 1;
    if ((a.availabilityStatus === 'Available') !== (b.availabilityStatus === 'Available')) {
      return a.availabilityStatus === 'Available' ? -1 : 1;
    }
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return a.estimatedFreight - b.estimatedFreight;
  });

  // Identify Best Match among available and suitable vehicles
  const bestMatch = options.find(opt => opt.isSuitable && opt.availabilityStatus === 'Available');
  if (bestMatch) {
    bestMatch.isBestMatch = true;
  }

  const suitableCount = options.filter(opt => opt.isSuitable && opt.availabilityStatus === 'Available').length;
  const totalAvailable = options.filter(opt => opt.availabilityStatus === 'Available').length;

  return {
    options,
    suitableCount,
    totalAvailable,
    pickupLocation: pickup,
    destination,
    distanceKm,
    estimatedTime,
    crop,
    requestedQuantityKg: quantityKg,
    dataSource
  };
}
