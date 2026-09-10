import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createVerifiedReview, updateReview, deleteReview, getReviewsForUser, getReviewsForOrder, getUserTrustScore } from '../services/trustScoreService.js';
const router = express.Router();
/**
 * Helper to get authenticated user ID from session or header
 */
function getAuthUserId(req) {
    const headerUserId = req.headers['x-user-id'];
    if (headerUserId && headerUserId.trim()) {
        return headerUserId.trim();
    }
    return req.user?.id || '039b5a52-cfab-42df-9cbc-22214e210de5';
}
/**
 * POST /api/reviews
 * Create a verified trade review
 */
router.post('/', requireAuth, async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const { order_id, communication_rating, quality_rating, reliability_rating, timeliness_rating, comment } = req.body;
        const result = await createVerifiedReview({
            order_id: String(order_id || ''),
            communication_rating,
            quality_rating,
            reliability_rating,
            timeliness_rating,
            comment
        }, userId);
        res.status(201).json({
            success: true,
            message: 'Verified review submitted successfully',
            data: result.review,
            trust_score: result.trust_score
        });
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({
            success: false,
            message: error.message || 'Failed to submit review'
        });
    }
});
/**
 * GET /api/reviews/order/:orderId
 * Get all reviews for a specific order
 */
router.get('/order/:orderId', requireAuth, async (req, res) => {
    try {
        const orderId = String(req.params.orderId || '');
        const reviews = await getReviewsForOrder(orderId);
        res.json({
            success: true,
            data: reviews
        });
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({
            success: false,
            message: error.message || 'Failed to fetch reviews for order'
        });
    }
});
/**
 * GET /api/reviews/trust-score/:userId
 * Get Trust Score summary for a specific user
 */
router.get('/trust-score/:userId', async (req, res) => {
    try {
        const userId = String(req.params.userId || '');
        const trustScore = await getUserTrustScore(userId);
        res.json({
            success: true,
            data: trustScore
        });
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({
            success: false,
            message: error.message || 'Failed to fetch trust score'
        });
    }
});
/**
 * GET /api/reviews/user/:userId
 * GET /api/reviews/:userId
 * Get reviews received by a user with aggregated trust metrics
 */
const handleUserReviews = async (req, res) => {
    try {
        const userId = String(req.params.userId || '');
        const summary = await getReviewsForUser(userId);
        res.json({
            success: true,
            data: summary
        });
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({
            success: false,
            message: error.message || 'Failed to fetch user reviews'
        });
    }
};
router.get('/user/:userId', handleUserReviews);
router.get('/:userId', handleUserReviews);
/**
 * PATCH /api/reviews/:reviewId
 * Edit a review (Author only)
 */
router.patch('/:reviewId', requireAuth, async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const reviewId = String(req.params.reviewId || '');
        const { communication_rating, quality_rating, reliability_rating, timeliness_rating, comment } = req.body;
        const result = await updateReview(reviewId, {
            communication_rating,
            quality_rating,
            reliability_rating,
            timeliness_rating,
            comment
        }, userId);
        res.json({
            success: true,
            message: 'Review updated successfully',
            data: result.review,
            trust_score: result.trust_score
        });
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({
            success: false,
            message: error.message || 'Failed to update review'
        });
    }
});
/**
 * DELETE /api/reviews/:reviewId
 * Delete a review (Author only)
 */
router.delete('/:reviewId', requireAuth, async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const reviewId = String(req.params.reviewId || '');
        const result = await deleteReview(reviewId, userId);
        res.json({
            success: true,
            message: 'Review deleted and trust score recalculated',
            data: {
                deleted_id: result.deleted_id,
                trust_score: result.trust_score
            }
        });
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({
            success: false,
            message: error.message || 'Failed to delete review'
        });
    }
});
export default router;
