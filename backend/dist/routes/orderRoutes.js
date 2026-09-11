import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { confirmFarmerTransport, lockEscrowDeposit, dispatchOrderLogistics, recordGpsTelemetry, getLatestGpsTelemetry, markOrderArrived, verifyOrderQualityAndWeight, markOrderDelivered, recordQualityAssay, recordOrderWeighment, releaseSmartPayout, generateOrderInvoice, getOrderAuditTrail } from '../services/orderLifecycleService.js';
const router = Router();
// =========================================================================
// 1. GET /api/orders (List Orders with Filtering & Pagination)
// =========================================================================
router.get('/', requireAuth, async (req, res) => {
    try {
        const user_id = req.user?.id;
        const { status, payment_status, role, page = '1', limit = '20' } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const offset = (pageNum - 1) * limitNum;
        let query = supabase
            .from('orders')
            .select('*', { count: 'exact' });
        if (status && typeof status === 'string') {
            query = query.ilike('status', status.trim());
        }
        if (payment_status && typeof payment_status === 'string') {
            query = query.ilike('payment_status', payment_status.trim());
        }
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
        query = query.order('created_at', { ascending: false }).range(offset, offset + limitNum - 1);
        const { data, count, error } = await query;
        if (error)
            throw error;
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
        res.status(500).json({ success: false, message: error.message || 'Failed to list orders' });
    }
});
// =========================================================================
// 2. GET /api/orders/:id (Single Order Details)
// =========================================================================
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', id)
            .single();
        if (error || !data) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// =========================================================================
// 3. POST /api/orders (Create Raw Order)
// =========================================================================
router.post('/', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .insert([req.body])
            .select()
            .single();
        if (error)
            throw error;
        res.status(201).json({ success: true, data });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
// =========================================================================
// 3.5. POST /api/orders/:id/confirm-transport (Confirm Transport Readiness - Farmer Only)
// =========================================================================
router.post('/:id/confirm-transport', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const { confirmed_by, notes } = req.body || {};
        const userRole = (req.user?.role || req.body?.user_role || req.headers['x-user-role'] || 'farmer').toLowerCase();
        const userDisplayName = req.user?.email ? req.user.email.split('@')[0] : (confirmed_by || 'Farmer');
        const result = await confirmFarmerTransport({
            order_id: id,
            user_id: req.user?.id || req.body?.user_id,
            user_role: userRole,
            confirmed_by: userDisplayName,
            notes
        });
        res.status(200).json({
            success: true,
            message: 'Farmer confirmed transport readiness. Buyer can now lock escrow.',
            data: result
        });
    }
    catch (error) {
        const status = error.status || 400;
        res.status(status).json({ success: false, message: error.message });
    }
});
// =========================================================================
// 4. POST /api/orders/:id/escrow/lock (Lock Buyer Escrow Deposit)
// =========================================================================
router.post('/:id/escrow/lock', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const { deposit_amount, idempotency_key, notes } = req.body;
        const userRole = (req.user?.role || req.body?.user_role || req.headers['x-user-role'] || 'buyer').toLowerCase();
        const result = await lockEscrowDeposit({
            order_id: id,
            user_id: req.user?.id || req.body?.user_id,
            user_role: userRole,
            buyer_id: req.user?.id,
            deposit_amount,
            idempotency_key,
            notes
        });
        res.status(200).json({
            success: true,
            message: 'Buyer escrow deposit locked successfully in smart escrow vault',
            data: result
        });
    }
    catch (error) {
        const status = error.status || 400;
        res.status(status).json({ success: false, message: error.message });
    }
});
// =========================================================================
// 5. POST /api/orders/:id/dispatch (Dispatch Shipment & Assign Fleet)
// =========================================================================
router.post('/:id/dispatch', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const { vehicle_id, vehicle_name, vehicle_type, vehicle_number, driver_name, driver_phone, pickup_location, delivery_location, pickup_node_id, delivery_node_id, route_id, estimated_distance_km, estimated_duration_minutes, estimated_toll_cost } = req.body;
        if (!vehicle_name || !vehicle_type || !vehicle_number || !driver_name || !driver_phone) {
            return res.status(400).json({
                success: false,
                message: 'vehicle_name, vehicle_type, vehicle_number, driver_name, and driver_phone are required'
            });
        }
        const userRole = (req.user?.role || req.body?.user_role || req.headers['x-user-role'] || 'buyer').toLowerCase();
        const result = await dispatchOrderLogistics(id, {
            vehicle_id,
            vehicle_name,
            vehicle_type,
            vehicle_number,
            driver_name,
            driver_phone,
            pickup_location,
            delivery_location,
            pickup_node_id,
            delivery_node_id,
            route_id,
            estimated_distance_km,
            estimated_duration_minutes,
            estimated_toll_cost
        }, {
            user_id: req.user?.id || req.body?.user_id,
            user_role: userRole
        });
        res.status(200).json({
            success: true,
            message: 'Order shipment dispatched successfully',
            data: result
        });
    }
    catch (error) {
        const status = error.status || 400;
        res.status(status).json({ success: false, message: error.message });
    }
});
// =========================================================================
// 6. POST /api/orders/:id/gps & GET /api/orders/:id/gps (Real Telemetry)
// =========================================================================
router.post('/:id/gps', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const { dispatch_id, latitude, longitude, speed_kmh, heading, checkpoint_name, progress_percent, eta } = req.body;
        const result = await recordGpsTelemetry(id, {
            dispatch_id,
            latitude: Number(latitude),
            longitude: Number(longitude),
            speed_kmh: Number(speed_kmh || 0),
            heading: heading !== undefined ? Number(heading) : undefined,
            checkpoint_name,
            progress_percent: progress_percent !== undefined ? Number(progress_percent) : undefined,
            eta
        });
        res.status(201).json({
            success: true,
            message: 'GPS telemetry position recorded',
            data: result
        });
    }
    catch (error) {
        const status = error.status || 400;
        res.status(status).json({ success: false, message: error.message });
    }
});
router.get('/:id/gps', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const telemetry = await getLatestGpsTelemetry(id);
        res.json({
            success: true,
            data: telemetry
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// =========================================================================
// 7. POST /api/orders/:id/arrive (Mark Arrived at Destination - Action 1)
// =========================================================================
router.post('/:id/arrive', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const { arrival_remarks, arrived_by } = req.body || {};
        const userRole = (req.user?.role || req.body?.user_role || req.headers['x-user-role'] || 'buyer').toLowerCase();
        const userDisplayName = req.user?.email ? req.user.email.split('@')[0] : (arrived_by || 'Destination Hub Inspector');
        const result = await markOrderArrived(id, {
            arrived_by: userDisplayName,
            arrival_remarks,
            user_id: req.user?.id || req.body?.user_id,
            user_role: userRole
        });
        res.status(200).json({
            success: true,
            message: 'Shipment arrival recorded successfully',
            data: result
        });
    }
    catch (error) {
        const status = error.status || 400;
        res.status(status).json({ success: false, message: error.message });
    }
});
// =========================================================================
// 7.5. POST /api/orders/:id/verify (Verify Weight & Quality - Action 2)
// =========================================================================
router.post('/:id/verify', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const { actual_received_quantity, actual_quantity_unit, quality_grade, assay_result, assay_notes, verification_remarks, verified_by } = req.body || {};
        const userRole = (req.user?.role || req.body?.user_role || req.headers['x-user-role'] || 'buyer').toLowerCase();
        const userDisplayName = req.user?.email ? req.user.email.split('@')[0] : (verified_by || 'Quality Verifier');
        const result = await verifyOrderQualityAndWeight(id, {
            actual_received_quantity: Number(actual_received_quantity),
            actual_quantity_unit,
            quality_grade,
            assay_result,
            assay_notes,
            verification_remarks,
            verified_by: userDisplayName,
            user_id: req.user?.id || req.body?.user_id,
            user_role: userRole
        });
        res.status(200).json({
            success: true,
            message: 'Weight and quality verified successfully',
            data: result
        });
    }
    catch (error) {
        const status = error.status || 400;
        res.status(status).json({ success: false, message: error.message });
    }
});
// =========================================================================
// 7.8. POST /api/orders/:id/deliver (Legacy compatibility)
// =========================================================================
router.post('/:id/deliver', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const result = await markOrderDelivered(id);
        res.status(200).json({
            success: true,
            message: 'Order marked as delivered at destination hub',
            data: result
        });
    }
    catch (error) {
        const status = error.status || 400;
        res.status(status).json({ success: false, message: error.message });
    }
});
// =========================================================================
// 8. POST /api/orders/:id/assay (Destination Quality Assay Verification)
// =========================================================================
router.post('/:id/assay', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const { inspector_id, inspector_name, lab_name, tested_grade, target_grade, moisture_percentage, foreign_matter_percentage, certificate_number, certificate_url, assay_passed, notes } = req.body;
        const result = await recordQualityAssay(id, {
            inspector_id,
            inspector_name,
            lab_name,
            tested_grade,
            target_grade,
            moisture_percentage: moisture_percentage !== undefined ? Number(moisture_percentage) : undefined,
            foreign_matter_percentage: foreign_matter_percentage !== undefined ? Number(foreign_matter_percentage) : undefined,
            certificate_number,
            certificate_url,
            assay_passed: Boolean(assay_passed),
            notes
        });
        res.status(201).json({
            success: true,
            message: 'Quality assay inspection recorded successfully',
            data: result
        });
    }
    catch (error) {
        const status = error.status || 400;
        res.status(status).json({ success: false, message: error.message });
    }
});
// =========================================================================
// 9. POST /api/orders/:id/weighment (Destination Weighbridge Slip Verification)
// =========================================================================
router.post('/:id/weighment', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const { weighbridge_name, weighbridge_slip_id, operator_name, gross_weight, tare_weight, unit, notes } = req.body;
        const result = await recordOrderWeighment(id, {
            weighbridge_name,
            weighbridge_slip_id,
            operator_name,
            gross_weight: Number(gross_weight),
            tare_weight: Number(tare_weight),
            unit,
            notes
        });
        res.status(201).json({
            success: true,
            message: 'Weighbridge weighment verification recorded successfully',
            data: result
        });
    }
    catch (error) {
        const status = error.status || 400;
        res.status(status).json({ success: false, message: error.message });
    }
});
// =========================================================================
// 10. POST /api/orders/:id/release-payout & /api/orders/:id/escrow/release (Action 3)
// =========================================================================
const handleReleasePayout = async (req, res) => {
    try {
        const id = req.params.id;
        const { idempotency_key, notes } = req.body || {};
        const userRole = (req.user?.role || req.body?.user_role || req.headers['x-user-role'] || 'buyer').toLowerCase();
        const result = await releaseSmartPayout({
            order_id: id,
            user_id: req.user?.id || req.body?.user_id,
            user_role: userRole,
            idempotency_key,
            notes
        });
        res.status(200).json({
            success: true,
            message: 'Smart escrow payout released to farmer upon dual assay & weighment verification',
            data: result
        });
    }
    catch (error) {
        const status = error.status || 400;
        res.status(status).json({ success: false, message: error.message });
    }
};
router.post('/:id/escrow/release', requireAuth, handleReleasePayout);
router.post('/:id/release-payout', requireAuth, handleReleasePayout);
// =========================================================================
// 11. GET /api/orders/:id/invoice (Digital Invoice & Settlement Summary)
// =========================================================================
router.get('/:id/invoice', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const invoice = await generateOrderInvoice(id);
        res.json({
            success: true,
            data: invoice
        });
    }
    catch (error) {
        const status = error.status || 404;
        res.status(status).json({ success: false, message: error.message });
    }
});
// =========================================================================
// 12. GET /api/orders/:id/audit-trail (Immutable Financial & Event Audit Ledger)
// =========================================================================
router.get('/:id/audit-trail', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const auditTrail = await getOrderAuditTrail(id);
        res.json({
            success: true,
            data: auditTrail
        });
    }
    catch (error) {
        const status = error.status || 404;
        res.status(status).json({ success: false, message: error.message });
    }
});
// =========================================================================
// 13. PUT /api/orders/:id/status (Legacy status route compatibility)
// =========================================================================
router.put('/:id/status', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const { status, paymentStatus, trackingSteps } = req.body;
        const updatePayload = {};
        if (status)
            updatePayload.status = status;
        if (paymentStatus)
            updatePayload.payment_status = paymentStatus;
        if (trackingSteps)
            updatePayload.tracking_steps = trackingSteps;
        const { data, error } = await supabase
            .from('orders')
            .update(updatePayload)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
export default router;
