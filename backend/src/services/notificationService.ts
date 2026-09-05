/**
 * Fieldora Real-time Demand Alert & Notification Service
 */

import { supabase } from '../config/supabase.js';
import { findMatchesForRfq, MIN_MATCH_PERCENTAGE, MatchResult } from './matchingService.js';

export interface AlertNotificationPayload {
  farmer_id?: string | null;
  requirement_id: string;
  crop_name: string;
  variety?: string | null;
  required_quantity: number;
  unit: string;
  delivery_location?: string;
  target_price?: number | null;
  match_percentage: number;
  scores: any;
  distance_km?: number;
  read: boolean;
}

/**
 * Evaluates an RFQ and dispatches demand alerts to all qualifying matching farmers.
 * Prevents duplicates via unique (farmer_id, requirement_id) constraint.
 */
export async function processDemandAlertsForRfq(rfqId: string): Promise<{
  rfqId: string;
  totalCandidates: number;
  alertsGenerated: number;
  qualifyingFarmers: MatchResult[];
}> {
  try {
    const { rfq, matches } = await findMatchesForRfq(rfqId);

    // Filter qualifying matches at or above the minimum threshold (60%)
    const qualifying = matches.filter(m => m.match_percentage >= MIN_MATCH_PERCENTAGE);

    if (qualifying.length === 0) {
      return {
        rfqId,
        totalCandidates: matches.length,
        alertsGenerated: 0,
        qualifyingFarmers: []
      };
    }

    // Prepare deduplicated alert records
    const alertRecords: AlertNotificationPayload[] = [];
    const seenFarmerIds = new Set<string>();

    for (const match of qualifying) {
      const farmerKey = match.farmer_id || match.farmer_name || 'unassigned';
      if (seenFarmerIds.has(farmerKey)) continue;
      seenFarmerIds.add(farmerKey);

      alertRecords.push({
        farmer_id: match.farmer_id || null,
        requirement_id: rfq.id,
        crop_name: rfq.crop_name || rfq.crop,
        variety: rfq.variety || null,
        required_quantity: Number(rfq.required_quantity || rfq.quantity || 0),
        unit: rfq.unit || 'kg',
        delivery_location: rfq.delivery_location || '',
        target_price: rfq.target_price ? Number(rfq.target_price) : null,
        match_percentage: match.match_percentage,
        scores: match.scores,
        distance_km: match.distance_km,
        read: false
      });
    }

    if (alertRecords.length > 0) {
      const { data, error } = await supabase
        .from('demand_alerts')
        .upsert(alertRecords, {
          onConflict: 'farmer_id,requirement_id',
          ignoreDuplicates: true
        })
        .select();

      if (error) {
        console.error('Error inserting demand alerts:', error.message);
      } else {
        console.log(`📡 [Realtime Demand Alerts] Generated ${data?.length || alertRecords.length} alerts for RFQ ${rfqId}`);
      }
    }

    return {
      rfqId,
      totalCandidates: matches.length,
      alertsGenerated: alertRecords.length,
      qualifyingFarmers: qualifying
    };
  } catch (error: any) {
    console.error(`Error processing demand alerts for RFQ ${rfqId}:`, error.message);
    return {
      rfqId,
      totalCandidates: 0,
      alertsGenerated: 0,
      qualifyingFarmers: []
    };
  }
}
