/**
 * Fieldora Logistics Distance & Proximity Scoring Service
 */

export interface LocationCoords {
  lat: number;
  lng: number;
}

// Coordinate mapping for major Indian agricultural hubs, APMCs, and consuming metros
export const KNOWN_HUBS: Record<string, LocationCoords> = {
  // Maharashtra
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'vashi': { lat: 19.0770, lng: 72.9986 },
  'bhiwandi': { lat: 19.2967, lng: 73.0631 },
  'nashik': { lat: 19.9975, lng: 73.7898 },
  'lasalgaon': { lat: 20.1472, lng: 74.2253 },
  'pune': { lat: 18.5204, lng: 73.8567 },
  'nagpur': { lat: 21.1458, lng: 79.0882 },
  'kolhapur': { lat: 16.7050, lng: 74.2433 },
  'solapur': { lat: 17.6599, lng: 75.9064 },
  'aurangabad': { lat: 19.8762, lng: 75.3433 },
  'chhatrapati sambhajinagar': { lat: 19.8762, lng: 75.3433 },

  // Madhya Pradesh
  'indore': { lat: 22.7196, lng: 75.8577 },
  'ujjain': { lat: 23.1765, lng: 75.7885 },
  'bhopal': { lat: 23.2599, lng: 77.4126 },

  // Gujarat
  'ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'surat': { lat: 21.1702, lng: 72.8311 },
  'rajkot': { lat: 22.3039, lng: 70.8022 },
  'unjha': { lat: 23.8037, lng: 72.3922 },

  // Rajasthan
  'jaipur': { lat: 26.9124, lng: 75.7873 },
  'jodhpur': { lat: 26.2389, lng: 73.0243 },
  'kota': { lat: 25.2138, lng: 75.8648 },

  // Haryana / Punjab / Delhi NCR
  'delhi': { lat: 28.7041, lng: 77.1025 },
  'karnal': { lat: 29.6857, lng: 76.9905 },
  'chandigarh': { lat: 30.7333, lng: 76.7794 },
  'amritsar': { lat: 31.6340, lng: 74.8723 },

  // South India
  'bengaluru': { lat: 12.9716, lng: 77.5946 },
  'chikkamagaluru': { lat: 13.3161, lng: 75.7720 },
  'gulbarga': { lat: 17.3297, lng: 76.8343 },
  'kalaburagi': { lat: 17.3297, lng: 76.8343 },
  'hyderabad': { lat: 17.3850, lng: 78.4867 },
  'guntur': { lat: 16.3067, lng: 80.4365 },
  'chennai': { lat: 13.0827, lng: 80.2707 }
};

export interface DistanceThreshold {
  maxKm: number;
  score: number;
}

export const DISTANCE_THRESHOLDS: DistanceThreshold[] = [
  { maxKm: 25, score: 100 },
  { maxKm: 50, score: 90 },
  { maxKm: 100, score: 75 },
  { maxKm: 200, score: 60 },
  { maxKm: 400, score: 40 },
  { maxKm: 600, score: 20 }
];

/**
 * Finds approximate coordinates from a free-text location string.
 */
export function resolveCoordinates(locationStr: string): LocationCoords | null {
  if (!locationStr || typeof locationStr !== 'string') return null;

  const normalized = locationStr.toLowerCase();
  for (const [hubName, coords] of Object.entries(KNOWN_HUBS)) {
    if (normalized.includes(hubName)) {
      return coords;
    }
  }

  return null;
}

/**
 * Calculates Great-Circle distance between two coordinates using the Haversine formula (in km).
 */
export function haversineDistance(c1: LocationCoords, c2: LocationCoords): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = (c2.lat - c1.lat) * (Math.PI / 180);
  const dLon = (c2.lng - c1.lng) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(c1.lat * (Math.PI / 180)) *
      Math.cos(c2.lat * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Calculates distance in km between farmer supply location and buyer delivery location.
 * Uses exact Haversine if coordinates match, or a realistic heuristic default if unknown.
 */
export function calculateDistanceKm(farmerLoc: string, buyerLoc: string): number {
  const fLower = (farmerLoc || '').toLowerCase().trim();
  const bLower = (buyerLoc || '').toLowerCase().trim();

  // 1. Established Key Agri-Transport Corridors
  if (fLower === bLower) return 15;
  if ((fLower.includes('nashik') && bLower.includes('mumbai')) || (fLower.includes('mumbai') && bLower.includes('nashik'))) return 165;
  if ((fLower.includes('lasalgaon') && bLower.includes('mumbai')) || (fLower.includes('mumbai') && bLower.includes('lasalgaon'))) return 195;
  if ((fLower.includes('pimpalgaon') && bLower.includes('mumbai')) || (fLower.includes('mumbai') && bLower.includes('pimpalgaon'))) return 185;
  if ((fLower.includes('sinnar') && bLower.includes('mumbai')) || (fLower.includes('mumbai') && bLower.includes('sinnar'))) return 150;
  if ((fLower.includes('pune') && bLower.includes('mumbai')) || (fLower.includes('mumbai') && bLower.includes('pune'))) return 148;
  if ((fLower.includes('nashik') && bLower.includes('pune')) || (fLower.includes('pune') && bLower.includes('nashik'))) return 210;
  if ((fLower.includes('indore') && bLower.includes('mumbai')) || (fLower.includes('mumbai') && bLower.includes('indore'))) return 585;

  // 2. Coordinate-based Haversine with highway road factor
  const c1 = resolveCoordinates(farmerLoc);
  const c2 = resolveCoordinates(buyerLoc);

  if (c1 && c2) {
    const d = haversineDistance(c1, c2);
    // Road travel adjustment factor (crow-fly vs highway travel ~ 1.18x)
    return Math.max(10, Math.round(d * 1.18));
  }

  return 120; // Standard regional corridor average fallback
}

/**
 * Converts distance in kilometers to a 0-100 score according to configured thresholds.
 */
export function calculateDistanceScore(distanceKm: number): number {
  if (distanceKm < 0) return 0;

  for (const threshold of DISTANCE_THRESHOLDS) {
    if (distanceKm <= threshold.maxKm) {
      return threshold.score;
    }
  }

  return 0; // Over 600 km
}
