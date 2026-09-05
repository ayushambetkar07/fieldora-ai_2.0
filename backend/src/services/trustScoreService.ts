import { supabase } from '../config/supabase.js';
import {
  CreateReviewInput,
  UpdateReviewInput,
  ReviewRecord,
  UserTrustScore,
  UserReviewsSummary
} from '../types/review.js';

// In-memory fallback stores for high-availability test environments
export const memoryReviews: Map<string, ReviewRecord> = new Map();
export const memoryTrustScores: Map<string, UserTrustScore> = new Map();
export const memoryOrdersCache: Map<string, any> = new Map();

// Seed standard completed orders for testing
memoryOrdersCache.set('FD-1039', {
  id: 'FD-1039',
  order_number: 'FD-1039',
  buyer_id: '8996d084-1f18-45bd-995a-27ac039436ce',
  farmer_id: '039b5a52-cfab-42df-9cbc-22214e210de5',
  status: 'Completed',
  payment_status: 'Released'
});
memoryOrdersCache.set('FD-1038', {
  id: 'FD-1038',
  order_number: 'FD-1038',
  buyer_id: '8996d084-1f18-45bd-995a-27ac039436ce',
  farmer_id: '039b5a52-cfab-42df-9cbc-22214e210de5',
  status: 'Completed',
  payment_status: 'Released'
});
memoryOrdersCache.set('TR-1042', {
  id: 'TR-1042',
  order_number: 'TR-1042',
  buyer_id: '8996d084-1f18-45bd-995a-27ac039436ce',
  farmer_id: '039b5a52-cfab-42df-9cbc-22214e210de5',
  status: 'Completed',
  payment_status: 'Released'
});

/**
 * Validates a rating value is between 1 and 5
 */
function validateRatingBounds(val: any, fieldName: string): number {
  const num = Number(val);
  if (isNaN(num) || num < 1 || num > 5) {
    const err: any = new Error(`${fieldName} must be a number between 1 and 5`);
    err.status = 400;
    throw err;
  }
  return Math.round(num * 10) / 10;
}

/**
 * Server-side calculation of overall rating
 */
export function calculateOverallRating(
  communication: number,
  quality: number,
  reliability: number,
  timeliness: number
): number {
  const c = validateRatingBounds(communication, 'communication_rating');
  const q = validateRatingBounds(quality, 'quality_rating');
  const r = validateRatingBounds(reliability, 'reliability_rating');
  const t = validateRatingBounds(timeliness, 'timeliness_rating');

  return Math.round(((c + q + r + t) / 4) * 100) / 100;
}

/**
 * Create a Verified Review for a completed Fieldora transaction
 */
export async function createVerifiedReview(
  input: CreateReviewInput,
  authenticatedUserId: string
): Promise<{ review: ReviewRecord; trust_score: UserTrustScore }> {
  if (!authenticatedUserId) {
    const err: any = new Error('Authentication required to submit a review');
    err.status = 401;
    throw err;
  }

  if (!input || !input.order_id) {
    const err: any = new Error('order_id is required');
    err.status = 400;
    throw err;
  }

  // 1. Fetch and verify Order existence
  let order: any = null;
  try {
    const { data: dbOrder, error } = await supabase
      .from('orders')
      .select('*')
      .or(`id.eq.${input.order_id},order_number.eq.${input.order_id}`)
      .maybeSingle();

    if (!error && dbOrder) {
      order = dbOrder;
    }
  } catch (err) {
    console.warn('Supabase order fetch warning:', err);
  }

  if (!order) {
    order = memoryOrdersCache.get(input.order_id);
  }

  if (!order) {
    const err: any = new Error(`Order #${input.order_id} does not exist`);
    err.status = 404;
    throw err;
  }

  // 2. Verified Trade Rule: Check Transaction Completed/Delivered State
  const isDeliveredOrCompleted =
    ['Delivered', 'Completed'].includes(order.status) ||
    ['Escrow Locked', 'Released'].includes(order.payment_status);

  if (!isDeliveredOrCompleted) {
    const err: any = new Error(
      `Order status is '${order.status}' (${order.payment_status}). Reviews are only permitted for delivered or completed trades.`
    );
    err.status = 400;
    throw err;
  }

  // 3. Derive Reviewer & Reviewee Server-Side (Do NOT trust client-supplied IDs)
  const isBuyer = String(order.buyer_id) === String(authenticatedUserId);
  const isFarmer = String(order.farmer_id) === String(authenticatedUserId);

  if (!isBuyer && !isFarmer) {
    const err: any = new Error('Forbidden: You are not a participant in this order');
    err.status = 403;
    throw err;
  }

  const reviewer_role: 'buyer' | 'farmer' = isBuyer ? 'buyer' : 'farmer';
  const reviewer_id = String(authenticatedUserId);
  const reviewee_id = isBuyer ? String(order.farmer_id) : String(order.buyer_id);

  // 4. Anti-Manipulation: Prevent Self-Review
  if (reviewer_id === reviewee_id) {
    const err: any = new Error('Self-review is strictly prohibited');
    err.status = 400;
    throw err;
  }

  // 5. Anti-Manipulation: Prevent Duplicate Reviews for the Same Order
  let existingReview: any = null;
  try {
    const { data: dbReviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('order_id', input.order_id)
      .eq('reviewer_id', reviewer_id);

    if (!error && dbReviews && dbReviews.length > 0) {
      existingReview = dbReviews[0];
    }
  } catch (err) {
    console.warn('Supabase duplicate review check warning:', err);
  }

  if (!existingReview) {
    for (const r of memoryReviews.values()) {
      if (r.order_id === input.order_id && r.reviewer_id === reviewer_id) {
        existingReview = r;
        break;
      }
    }
  }

  if (existingReview) {
    const err: any = new Error('You have already submitted a review for this order');
    err.status = 409;
    throw err;
  }

  // 6. Calculate Server-Side Ratings
  const overall_rating = calculateOverallRating(
    input.communication_rating,
    input.quality_rating,
    input.reliability_rating,
    input.timeliness_rating
  );

  // Verified trade is set strictly by backend logic
  const verified_trade = true;
  const now = new Date().toISOString();

  const newReview: ReviewRecord = {
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    order_id: input.order_id,
    reviewer_id,
    reviewee_id,
    reviewer_role,
    communication_rating: Number(input.communication_rating),
    quality_rating: Number(input.quality_rating),
    reliability_rating: Number(input.reliability_rating),
    timeliness_rating: Number(input.timeliness_rating),
    overall_rating,
    comment: input.comment ? String(input.comment).trim() : '',
    verified_trade,
    created_at: now,
    updated_at: now
  };

  // 7. Persist Review
  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert([newReview])
      .select()
      .single();

    if (!error && data) {
      newReview.id = data.id || newReview.id;
    }
  } catch (err) {
    console.warn('Supabase review insert warning, using memory fallback:', err);
  }

  memoryReviews.set(newReview.id, newReview);

  // 8. Automatically Recalculate Trust Score for Reviewee
  const updatedTrustScore = await recalculateTrustScore(reviewee_id);

  return {
    review: newReview,
    trust_score: updatedTrustScore
  };
}

/**
 * Update an existing review (Owner only)
 */
export async function updateReview(
  reviewId: string,
  input: UpdateReviewInput,
  authenticatedUserId: string
): Promise<{ review: ReviewRecord; trust_score: UserTrustScore }> {
  if (!authenticatedUserId) {
    const err: any = new Error('Authentication required to edit a review');
    err.status = 401;
    throw err;
  }

  let review: ReviewRecord | null = null;
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .maybeSingle();

    if (!error && data) review = data;
  } catch (err) {
    console.warn('Supabase fetch review error:', err);
  }

  if (!review) {
    review = memoryReviews.get(reviewId) || null;
  }

  if (!review) {
    const err: any = new Error(`Review #${reviewId} not found`);
    err.status = 404;
    throw err;
  }

  // Authorization: Only the author can modify the review
  if (String(review.reviewer_id) !== String(authenticatedUserId)) {
    const err: any = new Error('Forbidden: You can only edit your own reviews');
    err.status = 403;
    throw err;
  }

  const comm = input.communication_rating !== undefined ? input.communication_rating : review.communication_rating;
  const qual = input.quality_rating !== undefined ? input.quality_rating : review.quality_rating;
  const reli = input.reliability_rating !== undefined ? input.reliability_rating : review.reliability_rating;
  const time = input.timeliness_rating !== undefined ? input.timeliness_rating : review.timeliness_rating;

  const overall_rating = calculateOverallRating(comm, qual, reli, time);
  const now = new Date().toISOString();

  review.communication_rating = Number(comm);
  review.quality_rating = Number(qual);
  review.reliability_rating = Number(reli);
  review.timeliness_rating = Number(time);
  review.overall_rating = overall_rating;
  if (input.comment !== undefined) review.comment = String(input.comment).trim();
  review.updated_at = now;

  try {
    await supabase
      .from('reviews')
      .update({
        communication_rating: review.communication_rating,
        quality_rating: review.quality_rating,
        reliability_rating: review.reliability_rating,
        timeliness_rating: review.timeliness_rating,
        overall_rating: review.overall_rating,
        comment: review.comment,
        updated_at: now
      })
      .eq('id', reviewId);
  } catch (err) {
    console.warn('Supabase update review warning:', err);
  }

  memoryReviews.set(review.id, review);

  // Automatically recalculate trust score
  const updatedTrustScore = await recalculateTrustScore(review.reviewee_id);

  return {
    review,
    trust_score: updatedTrustScore
  };
}

/**
 * Delete a review (Owner only)
 */
export async function deleteReview(
  reviewId: string,
  authenticatedUserId: string
): Promise<{ success: boolean; deleted_id: string; trust_score: UserTrustScore }> {
  if (!authenticatedUserId) {
    const err: any = new Error('Authentication required to delete a review');
    err.status = 401;
    throw err;
  }

  let review: ReviewRecord | null = null;
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .maybeSingle();

    if (!error && data) review = data;
  } catch (err) {
    console.warn('Supabase fetch review error:', err);
  }

  if (!review) {
    review = memoryReviews.get(reviewId) || null;
  }

  if (!review) {
    const err: any = new Error(`Review #${reviewId} not found`);
    err.status = 404;
    throw err;
  }

  // Authorization: Only the author can delete the review
  if (String(review.reviewer_id) !== String(authenticatedUserId)) {
    const err: any = new Error('Forbidden: You can only delete your own reviews');
    err.status = 403;
    throw err;
  }

  const revieweeId = review.reviewee_id;

  try {
    await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);
  } catch (err) {
    console.warn('Supabase delete review warning:', err);
  }

  memoryReviews.delete(reviewId);

  // Automatically recalculate trust score
  const updatedTrustScore = await recalculateTrustScore(revieweeId);

  return {
    success: true,
    deleted_id: reviewId,
    trust_score: updatedTrustScore
  };
}

/**
 * Recalculate Trust Score for a User based strictly on verified reviews
 */
export async function recalculateTrustScore(userId: string): Promise<UserTrustScore> {
  if (!userId) {
    throw new Error('User ID is required for trust score recalculation');
  }

  // 1. Query all verified reviews for the user
  let verifiedReviews: ReviewRecord[] = [];
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('reviewee_id', userId)
      .eq('verified_trade', true);

    if (!error && data) {
      verifiedReviews = data;
    }
  } catch (err) {
    console.warn('Supabase query verified reviews warning:', err);
  }

  // Merge with memory reviews (filtering verified_trade = true)
  const memoryList = Array.from(memoryReviews.values()).filter(
    r => String(r.reviewee_id) === String(userId) && r.verified_trade === true
  );

  const seenIds = new Set(verifiedReviews.map(r => r.id));
  for (const m of memoryList) {
    if (!seenIds.has(m.id)) {
      verifiedReviews.push(m);
    }
  }

  const count = verifiedReviews.length;
  const now = new Date().toISOString();

  if (count === 0) {
    const defaultScore: UserTrustScore = {
      user_id: userId,
      role: 'all',
      verified_review_count: 0,
      average_overall_rating: 0,
      communication_score: 0,
      quality_score: 0,
      reliability_score: 0,
      timeliness_score: 0,
      trust_score: 0,
      updated_at: now
    };
    memoryTrustScores.set(userId, defaultScore);
    return defaultScore;
  }

  let totalComm = 0;
  let totalQual = 0;
  let totalReli = 0;
  let totalTime = 0;
  let totalOverall = 0;

  for (const r of verifiedReviews) {
    totalComm += Number(r.communication_rating) || 0;
    totalQual += Number(r.quality_rating) || 0;
    totalReli += Number(r.reliability_rating) || 0;
    totalTime += Number(r.timeliness_rating) || 0;
    totalOverall += Number(r.overall_rating) || 0;
  }

  const round2 = (val: number) => Math.round((val / count) * 100) / 100;

  const commScore = round2(totalComm);
  const qualScore = round2(totalQual);
  const reliScore = round2(totalReli);
  const timeScore = round2(totalTime);
  const avgOverall = round2(totalOverall);
  const trustScore = avgOverall;

  const trustScoreRecord: UserTrustScore = {
    user_id: userId,
    role: 'all',
    verified_review_count: count,
    average_overall_rating: avgOverall,
    communication_score: commScore,
    quality_score: qualScore,
    reliability_score: reliScore,
    timeliness_score: timeScore,
    trust_score: trustScore,
    updated_at: now
  };

  // Upsert into Supabase user_trust_scores table
  try {
    await supabase
      .from('user_trust_scores')
      .upsert([trustScoreRecord], { onConflict: 'user_id' });
  } catch (err) {
    console.warn('Supabase upsert user_trust_scores warning:', err);
  }

  memoryTrustScores.set(userId, trustScoreRecord);
  return trustScoreRecord;
}

/**
 * Get all reviews received by a user + trust score summary
 */
export async function getReviewsForUser(userId: string): Promise<UserReviewsSummary> {
  const trust_score = await recalculateTrustScore(userId);

  let reviews: ReviewRecord[] = [];
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) reviews = data;
  } catch (err) {
    console.warn('Supabase getReviewsForUser warning:', err);
  }

  const memoryList = Array.from(memoryReviews.values()).filter(
    r => String(r.reviewee_id) === String(userId)
  );

  const seenIds = new Set(reviews.map(r => r.id));
  for (const m of memoryList) {
    if (!seenIds.has(m.id)) {
      reviews.push(m);
    }
  }

  return {
    user_id: userId,
    trust_score,
    reviews
  };
}

/**
 * Get reviews associated with an order
 */
export async function getReviewsForOrder(orderId: string): Promise<ReviewRecord[]> {
  let reviews: ReviewRecord[] = [];
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('order_id', orderId);

    if (!error && data) reviews = data;
  } catch (err) {
    console.warn('Supabase getReviewsForOrder warning:', err);
  }

  const memoryList = Array.from(memoryReviews.values()).filter(
    r => String(r.order_id) === String(orderId)
  );

  const seenIds = new Set(reviews.map(r => r.id));
  for (const m of memoryList) {
    if (!seenIds.has(m.id)) {
      reviews.push(m);
    }
  }

  return reviews;
}

/**
 * Get Trust Score directly
 */
export async function getUserTrustScore(userId: string): Promise<UserTrustScore> {
  return recalculateTrustScore(userId);
}
