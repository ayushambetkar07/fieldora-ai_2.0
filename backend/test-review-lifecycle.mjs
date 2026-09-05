import { supabase } from './dist/config/supabase.js';
import {
  createVerifiedReview,
  updateReview,
  getReviewsForOrder,
  getReviewsForUser,
  getUserTrustScore,
  memoryReviews,
  memoryTrustScores,
  memoryOrdersCache
} from './dist/services/trustScoreService.js';

async function runTests() {
  console.log('================================================================');
  console.log('🚀 RUNNING VERIFIED REVIEWS & TRUST SCORE PERSISTENCE TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  const farmerId = '039b5a52-cfab-42df-9cbc-22214e210de5';
  const buyerId = '8996d084-1f18-45bd-995a-27ac039436ce';
  const orderId = 'FD-1039';

  // Ensure test order exists in cache
  memoryOrdersCache.set(orderId, {
    id: orderId,
    order_number: orderId,
    buyer_id: buyerId,
    farmer_id: farmerId,
    status: 'Completed',
    payment_status: 'Released'
  });

  // Clear any existing review for clean test run
  for (const [id, r] of memoryReviews.entries()) {
    if (r.order_id === orderId && r.reviewer_id === farmerId) {
      memoryReviews.delete(id);
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: Initial Order Review State (Empty)
    // -------------------------------------------------------------
    console.log('--- Test 1: Initial Order Review Query ---');
    const initialReviews = await getReviewsForOrder(orderId);
    assert(Array.isArray(initialReviews), `getReviewsForOrder returned array`);

    // -------------------------------------------------------------
    // Test 2: Submit Verified Review (5, 5, 5, 4)
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Submit Verified Trade Review (5, 5, 5, 4) ---');
    const reviewPayload = {
      order_id: orderId,
      communication_rating: 5,
      quality_rating: 5,
      reliability_rating: 5,
      timeliness_rating: 4,
      comment: 'Excellent buyer communication and fast escrow clearance!'
    };

    const submitResult = await createVerifiedReview(reviewPayload, farmerId);
    assert(Boolean(submitResult && submitResult.review && submitResult.review.id), `Review created with ID: ${submitResult.review.id}`);
    assert(submitResult.review.overall_rating === 4.75, `Overall rating computed accurately: ${submitResult.review.overall_rating} / 5.0 (Formula: 19/4 = 4.75)`);
    assert(submitResult.review.verified_trade === true, `Review verified_trade is strictly true`);
    assert(submitResult.review.reviewer_id === farmerId, `Reviewer ID derived server-side from auth (${farmerId})`);
    assert(submitResult.review.reviewee_id === buyerId, `Reviewee ID derived server-side from order (${buyerId})`);

    // -------------------------------------------------------------
    // Test 3: Trust Score Recalculation
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Trust Score Recalculation ---');
    assert(submitResult.trust_score.trust_score === 4.75, `Buyer Trust Score updated to 4.75 / 5.0`);
    assert(submitResult.trust_score.communication_score === 5, `Communication score is 5.0 ★`);
    assert(submitResult.trust_score.timeliness_score === 4, `Timeliness score is 4.0 ★`);
    assert(submitResult.trust_score.verified_review_count >= 1, `Verified trade review count >= 1`);

    // -------------------------------------------------------------
    // Test 4: Review Persistence on Order (Survives Refresh Query)
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Review Persistence (Refresh Query) ---');
    const persistedReviews = await getReviewsForOrder(orderId);
    assert(persistedReviews.length >= 1, `getReviewsForOrder('${orderId}') returns saved review`);
    const myReview = persistedReviews.find(r => r.reviewer_id === farmerId);
    assert(Boolean(myReview), `Found review by reviewer ${farmerId}`);
    assert(myReview.overall_rating === 4.75, `Persisted overall rating is 4.75`);
    assert(myReview.comment.includes('Excellent buyer communication'), `Persisted written comment matches`);

    // -------------------------------------------------------------
    // Test 5: Duplicate Review Prevention (Must Return 409)
    // -------------------------------------------------------------
    console.log('\n--- Test 5: Duplicate Review Protection ---');
    try {
      await createVerifiedReview(reviewPayload, farmerId);
      assert(false, `Duplicate review should have been blocked`);
    } catch (err) {
      assert(err.status === 409 && err.message.includes('already submitted a review'), `Duplicate review correctly blocked with status 409: "${err.message}"`);
    }

    // -------------------------------------------------------------
    // Test 6: Anti-Self-Review Protection
    // -------------------------------------------------------------
    console.log('\n--- Test 6: Anti-Self-Review Protection ---');
    try {
      // Mock an order where buyer is farmer
      memoryOrdersCache.set('SELF-ORDER', {
        id: 'SELF-ORDER',
        order_number: 'SELF-ORDER',
        buyer_id: farmerId,
        farmer_id: farmerId,
        status: 'Completed',
        payment_status: 'Released'
      });
      await createVerifiedReview({ order_id: 'SELF-ORDER', communication_rating: 5, quality_rating: 5, reliability_rating: 5, timeliness_rating: 5 }, farmerId);
      assert(false, `Self-review should have been blocked`);
    } catch (err) {
      assert(err.status === 400 && err.message.includes('Self-review'), `Self-review blocked: "${err.message}"`);
    }

    // -------------------------------------------------------------
    // Test 7: Update Review (PATCH / Author Only)
    // -------------------------------------------------------------
    console.log('\n--- Test 7: Update Review ---');
    const updateResult = await updateReview(myReview.id, {
      communication_rating: 5,
      quality_rating: 5,
      reliability_rating: 5,
      timeliness_rating: 5,
      comment: 'Updated: 5/5 across all categories now!'
    }, farmerId);

    assert(updateResult.review.overall_rating === 5.0, `Updated overall rating is 5.0 / 5.0`);
    assert(updateResult.trust_score.trust_score === 5.0, `Recalculated trust score updated to 5.0`);

  } catch (error) {
    console.error('Unhandled test error:', error);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');
}

runTests();
