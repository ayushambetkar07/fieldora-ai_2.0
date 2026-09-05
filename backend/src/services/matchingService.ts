/**
 * Fieldora Smart Matching Engine
 * Deterministic multi-factor algorithm:
 * Crop (30%) + Variety (20%) + Quantity (25%) + Distance (25%)
 */

import { supabase } from '../config/supabase.js';
import { toKg, calculateQuantityScore } from '../utils/unitConversion.js';
import { calculateDistanceKm, calculateDistanceScore } from './distanceService.js';

export const MIN_MATCH_PERCENTAGE = 60;

export const MATCH_WEIGHTS = {
  CROP: 0.30,
  VARIETY: 0.20,
  QUANTITY: 0.25,
  DISTANCE: 0.25
} as const;

export interface MatchScores {
  crop: number;
  variety: number;
  quantity: number;
  distance: number;
}

export interface MatchResult {
  listing_id: string;
  farmer_id: string | null;
  farmer_name?: string;
  farm_name?: string;
  match_percentage: number;
  scores: MatchScores;
  distance_km: number;
  available_quantity: number;
  unit: string;
  price_per_unit?: number;
  crop: string;
  variety?: string;
  location: string;
}

export interface RfqData {
  id?: string;
  crop_name?: string;
  crop?: string;
  variety?: string | null;
  required_quantity?: number;
  quantity?: number;
  unit?: string;
  target_price?: number | null;
  delivery_location?: string;
  status?: string;
}

export interface ProduceListingData {
  id: string;
  farmer_id?: string | null;
  farmer_name?: string | null;
  farm_name?: string | null;
  crop?: string;
  crop_name?: string;
  variety?: string | null;
  quantity: number;
  unit?: string;
  expected_price?: number;
  location: string;
  status?: string;
  is_verified?: boolean;
}

/**
 * Normalizes text for case-insensitive exact comparison.
 */
export function normalizeText(text?: string | null): string {
  return (text || '').toLowerCase().trim().replace(/[\s\-_]+/g, ' ');
}

/**
 * Calculates crop compatibility score (0 or 100).
 */
export function calculateCropScore(rfqCrop: string, listingCrop: string): number {
  const normRfq = normalizeText(rfqCrop);
  const normListing = normalizeText(listingCrop);

  if (!normRfq || !normListing) return 0;
  if (normRfq === normListing) return 100;

  // Handle common crop equivalencies (e.g. soybean / soya bean, tomato / tomatoes)
  if (
    (normRfq.includes('soya') || normRfq.includes('soybean')) &&
    (normListing.includes('soya') || normListing.includes('soybean'))
  ) {
    return 100;
  }
  if (
    (normRfq.includes('tomato')) &&
    (normListing.includes('tomato'))
  ) {
    return 100;
  }
  if (
    (normRfq.includes('wheat')) &&
    (normListing.includes('wheat'))
  ) {
    return 100;
  }
  if (
    (normRfq.includes('onion')) &&
    (normListing.includes('onion'))
  ) {
    return 100;
  }
  if (
    (normRfq.includes('potato')) &&
    (normListing.includes('potato'))
  ) {
    return 100;
  }

  return 0;
}

/**
 * Calculates variety compatibility score (0 or 100).
 */
export function calculateVarietyScore(rfqVariety?: string | null, listingVariety?: string | null): number {
  const normRfq = normalizeText(rfqVariety);
  const normListing = normalizeText(listingVariety);

  // If the buyer did not specify a variety, any variety satisfies the requirement
  if (!normRfq) {
    return 100;
  }

  // If buyer specified a variety but listing has none
  if (!normListing) {
    return 0;
  }

  // Exact match or contains
  if (normRfq === normListing || normListing.includes(normRfq) || normRfq.includes(normListing)) {
    return 100;
  }

  return 0;
}

/**
 * Calculates full deterministic match between a single RFQ and a farmer produce listing.
 */
export function calculateMatch(rfq: RfqData, listing: ProduceListingData): {
  matchPercentage: number;
  scores: MatchScores;
  distanceKm: number;
} {
  const rfqCrop = rfq.crop_name || rfq.crop || '';
  const listingCrop = listing.crop_name || listing.crop || '';

  const cropScore = calculateCropScore(rfqCrop, listingCrop);
  const varietyScore = calculateVarietyScore(rfq.variety, listing.variety);
  
  const rfqQty = Number(rfq.required_quantity || rfq.quantity || 0);
  const rfqUnit = rfq.unit || 'kg';
  const listingQty = Number(listing.quantity || 0);
  const listingUnit = listing.unit || 'kg';

  const quantityScore = calculateQuantityScore(rfqQty, rfqUnit, listingQty, listingUnit);

  const distanceKm = calculateDistanceKm(listing.location || '', rfq.delivery_location || '');
  const distanceScore = calculateDistanceScore(distanceKm);

  // If crop does not match, overall match is 0
  if (cropScore === 0) {
    return {
      matchPercentage: 0,
      scores: {
        crop: 0,
        variety: varietyScore,
        quantity: quantityScore,
        distance: distanceScore
      },
      distanceKm
    };
  }

  // Price compatibility evaluation if target_price and expected_price exist
  const rfqPrice = Number(rfq.target_price);
  const listingPrice = Number(listing.expected_price);
  let priceDampener = 1.0;
  if (!isNaN(rfqPrice) && rfqPrice > 0 && !isNaN(listingPrice) && listingPrice > 0) {
    const ratio = rfqPrice / listingPrice;
    if (ratio <= 0.05) {
      return {
        matchPercentage: 0,
        scores: {
          crop: cropScore,
          variety: varietyScore,
          quantity: quantityScore,
          distance: distanceScore
        },
        distanceKm
      };
    } else if (ratio < 0.7) {
      priceDampener = Math.pow(ratio, 1.2);
    }
  }

  const rawPercentage =
    (cropScore * MATCH_WEIGHTS.CROP +
    varietyScore * MATCH_WEIGHTS.VARIETY +
    quantityScore * MATCH_WEIGHTS.QUANTITY +
    distanceScore * MATCH_WEIGHTS.DISTANCE) * priceDampener;

  const matchPercentage = Math.round(rawPercentage);

  return {
    matchPercentage: Math.min(100, Math.max(0, matchPercentage)),
    scores: {
      crop: cropScore,
      variety: varietyScore,
      quantity: quantityScore,
      distance: distanceScore
    },
    distanceKm
  };
}

/**
 * Queries active candidate produce listings and computes ranked matches for an RFQ.
 */
export async function findMatchesForRfq(rfqId: string): Promise<{ rfq: any; matches: MatchResult[] }> {
  // 1. Fetch the RFQ
  const { data: rfq, error: rfqError } = await supabase
    .from('buyer_requirements')
    .select('*')
    .eq('id', rfqId)
    .single();

  if (rfqError || !rfq) {
    throw new Error(`Buyer requirement not found: ${rfqId}`);
  }

  const rfqCrop = rfq.crop_name || rfq.crop || '';

  // 2. Query available candidate farmer listings
  const { data: listings, error: listingError } = await supabase
    .from('produce_listings')
    .select('*')
    .in('status', ['Active', 'available', 'active']);

  if (listingError) {
    console.error('Failed to query produce listings for matching:', listingError);
    return { rfq, matches: [] };
  }

  const matches: MatchResult[] = [];

  for (const listing of (listings || [])) {
    const { matchPercentage, scores, distanceKm } = calculateMatch(rfq, listing);

    // Only include listings where crop matches and score > 0
    if (scores.crop > 0 && matchPercentage > 0) {
      matches.push({
        listing_id: listing.id,
        farmer_id: listing.farmer_id || null,
        farmer_name: listing.farmer_name || 'Verified Farmer',
        farm_name: listing.farm_name || 'Partner Farm',
        match_percentage: matchPercentage,
        scores,
        distance_km: distanceKm,
        available_quantity: Number(listing.quantity),
        unit: listing.unit || 'kg',
        price_per_unit: listing.expected_price,
        crop: listing.crop || listing.crop_name,
        variety: listing.variety,
        location: listing.location
      });
    }
  }

  // 3. Sort by match percentage DESC
  matches.sort((a, b) => b.match_percentage - a.match_percentage);

  return { rfq, matches };
}
