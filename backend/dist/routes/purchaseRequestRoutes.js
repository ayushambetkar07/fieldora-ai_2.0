import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { createPurchaseRequest, submitCounterOffer, acceptDeal, rejectDeal, cancelPurchaseRequest, getNegotiationOffers } from '../services/negotiationService.js';
const router = Router();
// =========================================================================
// 1. POST /api/purchase-requests (Create Initial Purchase Request)
// =========================================================================
router.post('/', requireAuth, async (req, res) => {
    try {
        const buyer_id = req.body.buyer_id || (req.user?.role === 'buyer' ? req.user.id : '8996d084-1f18-45bd-995a-27ac039436ce');
        const listing_id = req.body.listing_id || req.body.produce_id;
        const requested_quantity = Number(req.body.requested_quantity || req.body.quantity);
        const offered_price_per_unit = Number(req.body.offered_price_per_unit || req.body.offered_price || req.body.price);
        const unit = req.body.unit || 'kg';
        const result = await createPurchaseRequest({
            listing_id,
            requirement_id: req.body.requirement_id || null,
            buyer_id,
            buyer_name: req.body.buyer_name,
            buyer_company: req.body.buyer_company,
            requested_quantity,
            unit,
            offered_price_per_unit,
            delivery_location: req.body.delivery_location,
            required_date: req.body.required_date,
            message: req.body.message,
            expires_at: req.body.expires_at
        });
        res.status(201).json({
            success: true,
            message: 'Purchase request created successfully',
            data: result
        });
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({ success: false, message: error.message || 'Internal Server Error' });
    }
});
// =========================================================================
// 2. GET /api/purchase-requests (List Requests with Filtering & Pagination)
// =========================================================================
router.get('/', requireAuth, async (req, res) => {
    try {
        const user_id = req.user?.id;
        const { status, listing_id, role, page = '1', limit = '20' } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const offset = (pageNum - 1) * limitNum;
        let query = supabase
            .from('purchase_requests')
            .select('*', { count: 'exact' });
        // Status filter
        if (status && typeof status === 'string') {
            query = query.ilike('status', status.trim());
        }
        // Listing ID filter
        if (listing_id && typeof listing_id === 'string') {
            query = query.eq('listing_id', listing_id.trim());
        }
        // User scope filtering if not demo
        const isDemo = !user_id || user_id === '039b5a52-cfab-42df-9cbc-22214e210de5' || user_id === 'anonymous-demo-user';
        if (!isDemo) {
            if (role === 'farmer') {
                query = query.eq('farmer_id', user_id);
            }
            else if (role === 'buyer') {
                query = query.eq('buyer_id', user_id);
            }
            else {
                query = query.or(`buyer_id.eq.${user_id},farmer_id.eq.${user_id}`);
            }
        }
        query = query.order('updated_at', { ascending: false }).range(offset, offset + limitNum - 1);
        const { data, count, error } = await query;
        if (error) {
            throw error;
        }
        res.json({
            success: true,
            data: data || [],
            pagination: {
                total: count || 0,
                page: pageNum,
                limit: limitNum,
                pages: count ? Math.ceil(count / limitNum) : 0
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Failed to list purchase requests' });
    }
});
// =========================================================================
// 3. GET /api/purchase-requests/:id (Single Request with Listing & History)
// =========================================================================
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const { data: request, error } = await supabase
            .from('purchase_requests')
            .select('*')
            .eq('id', id)
            .single();
        if (error || !request) {
            return res.status(404).json({ success: false, message: 'Purchase request not found' });
        }
        // Attach produce listing if available
        const listingId = request.listing_id || request.produce_id;
        let listing = null;
        if (listingId) {
            const { data: listingData } = await supabase
                .from('produce_listings')
                .select('*')
                .eq('id', listingId)
                .single();
            listing = listingData;
        }
        const offers = await getNegotiationOffers(id);
        res.json({
            success: true,
            data: {
                ...request,
                offers
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
});
// =========================================================================
// 4. GET /api/purchase-requests/:id/offers (Chronological Negotiation History)
// =========================================================================
router.get('/:id/offers', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const offers = await getNegotiationOffers(id);
        res.json({
            success: true,
            data: offers
        });
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({ success: false, message: error.message || 'Failed to get offers' });
    }
});
// =========================================================================
// 5. POST /api/purchase-requests/:id/counter (Submit Counter-Offer)
// =========================================================================
router.post('/:id/counter', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const user_id = req.user?.id || '039b5a52-cfab-42df-9cbc-22214e210de5';
        const role = (req.body.role || req.body.offered_by_role || 'farmer');
        const quantity = Number(req.body.quantity || req.body.requested_quantity);
        const price_per_unit = Number(req.body.price_per_unit || req.body.price || req.body.offered_price_per_unit);
        const unit = req.body.unit || 'kg';
        const message = req.body.message;
        const result = await submitCounterOffer({
            purchase_request_id: id,
            user_id,
            role,
            quantity,
            unit,
            price_per_unit,
            message
        });
        res.status(200).json({
            success: true,
            message: 'Counter-offer submitted successfully',
            data: result
        });
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({ success: false, message: error.message || 'Failed to submit counter-offer' });
    }
});
// =========================================================================
// 6. POST /api/purchase-requests/:id/accept (Accept Current Deal)
// =========================================================================
router.post('/:id/accept', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const user_id = req.user?.id || '039b5a52-cfab-42df-9cbc-22214e210de5';
        const role = req.body.role;
        const result = await acceptDeal({
            purchase_request_id: id,
            user_id,
            role
        });
        res.status(200).json({
            success: true,
            message: 'Deal accepted successfully',
            data: result
        });
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({ success: false, message: error.message || 'Failed to accept deal' });
    }
});
// =========================================================================
// 7. POST /api/purchase-requests/:id/reject (Reject Deal)
// =========================================================================
router.post('/:id/reject', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const user_id = req.user?.id || '039b5a52-cfab-42df-9cbc-22214e210de5';
        const result = await rejectDeal({
            purchase_request_id: id,
            user_id
        });
        res.status(200).json({
            success: true,
            message: 'Purchase request rejected successfully',
            data: result
        });
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({ success: false, message: error.message || 'Failed to reject deal' });
    }
});
// =========================================================================
// 8. POST /api/purchase-requests/:id/cancel (Cancel Request)
// =========================================================================
router.post('/:id/cancel', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const user_id = req.user?.id || '039b5a52-cfab-42df-9cbc-22214e210de5';
        const result = await cancelPurchaseRequest(id, user_id);
        res.status(200).json({
            success: true,
            message: 'Purchase request cancelled successfully',
            data: result
        });
    }
    catch (error) {
        const status = error.status || 500;
        res.status(status).json({ success: false, message: error.message || 'Failed to cancel request' });
    }
});
// =========================================================================
// 9. PUT /api/purchase-requests/:id/status (Legacy status route compatibility)
// =========================================================================
router.put('/:id/status', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const { status } = req.body;
        const cleanStatus = (status || '').toLowerCase();
        if (cleanStatus === 'accepted' || cleanStatus === 'accept') {
            const result = await acceptDeal({ purchase_request_id: id, user_id: req.user?.id || '039b5a52-cfab-42df-9cbc-22214e210de5' });
            return res.json({ success: true, data: result });
        }
        else if (cleanStatus === 'rejected' || cleanStatus === 'reject') {
            const result = await rejectDeal({ purchase_request_id: id, user_id: req.user?.id || '039b5a52-cfab-42df-9cbc-22214e210de5' });
            return res.json({ success: true, data: result });
        }
        else if (cleanStatus === 'cancelled' || cleanStatus === 'cancel') {
            const result = await cancelPurchaseRequest(id, req.user?.id || '039b5a52-cfab-42df-9cbc-22214e210de5');
            return res.json({ success: true, data: result });
        }
        const { data, error } = await supabase
            .from('purchase_requests')
            .update({ status })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        res.json({ success: true, data });
    }
    catch (error) {
        const status = error.status || 400;
        res.status(status).json({ success: false, message: error.message });
    }
});
export default router;
