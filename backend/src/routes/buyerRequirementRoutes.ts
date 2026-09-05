/**
 * Fieldora Buyer Requirements & RFQ Routes
 */

import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { SUPPORTED_UNITS } from '../utils/unitConversion.js';
import { findMatchesForRfq } from '../services/matchingService.js';
import { processDemandAlertsForRfq } from '../services/notificationService.js';

const router = Router();

const VALID_STATUSES = ['open', 'closed', 'cancelled', 'fulfilled'] as const;

// 1. POST /api/buyer-requirements (Create RFQ)
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const rawCrop = req.body.crop_name || req.body.crop;
    const rawQuantity = req.body.required_quantity || req.body.quantity;
    const rawPrice = req.body.target_price;
    const rawUnit = req.body.unit || 'kg';
    const rawLocation = req.body.delivery_location || req.body.location;
    const { variety, required_by_date, description, payment_terms, quality_requirements } = req.body;

    // Derived from auth or body fallback
    const buyer_id = req.body.buyer_id || (req.user?.role === 'buyer' ? req.user.id : '8996d084-1f18-45bd-995a-27ac039436ce');
    const buyer_name = req.body.buyer_name || 'Ayush FMCG Procure';
    const company_name = req.body.company_name || 'FreshMart Agro Corp';

    // 1. Input Validations
    if (!rawCrop || typeof rawCrop !== 'string' || rawCrop.trim() === '') {
      return res.status(400).json({ success: false, message: 'crop_name is required and cannot be empty' });
    }

    if (rawQuantity === undefined || rawQuantity === null || isNaN(Number(rawQuantity)) || Number(rawQuantity) <= 0) {
      return res.status(400).json({ success: false, message: 'required_quantity must be a number greater than 0' });
    }

    const cleanUnit = (rawUnit || 'kg').toLowerCase().trim();
    if (!SUPPORTED_UNITS.includes(cleanUnit as any)) {
      return res.status(400).json({
        success: false,
        message: `unit must be one of: ${SUPPORTED_UNITS.join(', ')}`
      });
    }

    if (rawPrice !== undefined && rawPrice !== null && (isNaN(Number(rawPrice)) || Number(rawPrice) < 0)) {
      return res.status(400).json({ success: false, message: 'target_price must be a non-negative number' });
    }

    if (!rawLocation || typeof rawLocation !== 'string' || rawLocation.trim() === '') {
      return res.status(400).json({ success: false, message: 'delivery_location is required and cannot be empty' });
    }

    const payload = {
      buyer_id,
      buyer_name,
      company_name,
      crop: rawCrop.trim(),
      crop_name: rawCrop.trim(),
      variety: variety ? variety.trim() : null,
      quantity: Number(rawQuantity),
      required_quantity: Number(rawQuantity),
      unit: cleanUnit,
      target_price: rawPrice !== undefined && rawPrice !== null ? Number(rawPrice) : null,
      delivery_location: rawLocation.trim(),
      required_by_date: required_by_date || null,
      description: description ? description.trim() : null,
      payment_terms: payment_terms || '100% Escrow deposit locked',
      quality_requirements: quality_requirements || 'Grade A',
      status: 'open'
    };

    // 2. Insert into Supabase
    const { data, error } = await supabase
      .from('buyer_requirements')
      .insert([payload])
      .select()
      .single();

    if (error || !data) {
      console.error('Supabase INSERT buyer_requirements error:', error);
      return res.status(500).json({ success: false, message: 'Unable to submit buyer requirement' });
    }

    // 3. Process Smart Matching & Live Demand Alerts asynchronously
    processDemandAlertsForRfq(data.id).catch(err => {
      console.error('Asynchronous demand alert processing failed:', err);
    });

    return res.status(201).json({
      success: true,
      message: 'Buyer requirement submitted successfully',
      data
    });
  } catch (error: any) {
    console.error('Error creating buyer requirement:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// 2. GET /api/buyer-requirements (List RFQs with pagination & filters)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { crop_name, status, page = '1', limit = '20', buyer_id } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum - 1;

    let query = supabase
      .from('buyer_requirements')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(start, end);

    if (status && typeof status === 'string') {
      query = query.eq('status', status.trim().toLowerCase());
    }
    if (crop_name && typeof crop_name === 'string') {
      query = query.ilike('crop_name', `%${crop_name.trim()}%`);
    }
    if (buyer_id && typeof buyer_id === 'string') {
      query = query.eq('buyer_id', buyer_id);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('Supabase GET buyer_requirements error:', error);
      return res.status(500).json({ success: false, message: 'Unable to retrieve buyer requirements' });
    }

    res.json({
      success: true,
      data: data || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: count ? Math.ceil(count / limitNum) : 0
      }
    });
  } catch (error: any) {
    console.error('Error fetching buyer requirements:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// 3. GET /api/buyer-requirements/:id/matches (Get ranked matches for an RFQ)
router.get('/:id/matches', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { rfq, matches } = await findMatchesForRfq(id);

    res.json({
      success: true,
      rfq_id: rfq.id,
      crop: rfq.crop_name || rfq.crop,
      required_quantity: rfq.required_quantity || rfq.quantity,
      unit: rfq.unit,
      total_matches: matches.length,
      matches
    });
  } catch (error: any) {
    console.error('Error calculating RFQ matches:', error.message);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error.message || 'Internal Server Error'
    });
  }
});

// 4. GET /api/buyer-requirements/:id (Get single RFQ)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { data, error } = await supabase
      .from('buyer_requirements')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Buyer requirement not found' });
    }

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// 5. PATCH /api/buyer-requirements/:id (Update RFQ details)
router.patch('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const user_id = req.user?.id;

    // Check existence & ownership
    const { data: existing, error: findError } = await supabase
      .from('buyer_requirements')
      .select('*')
      .eq('id', id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({ success: false, message: 'Buyer requirement not found' });
    }

    // Enforce ownership if authenticated
    const isDemoUser = !user_id || user_id === '039b5a52-cfab-42df-9cbc-22214e210de5' || user_id === 'anonymous-demo-user';
    if (!isDemoUser && existing.buyer_id && existing.buyer_id !== user_id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this requirement' });
    }

    if (['closed', 'fulfilled', 'cancelled'].includes(existing.status)) {
      return res.status(409).json({ success: false, message: `Cannot update a requirement that is already ${existing.status}` });
    }

    const updates: any = {};
    if (req.body.crop_name || req.body.crop) {
      updates.crop_name = (req.body.crop_name || req.body.crop).trim();
      updates.crop = updates.crop_name;
    }
    if (req.body.variety !== undefined) updates.variety = req.body.variety ? req.body.variety.trim() : null;
    if (req.body.required_quantity !== undefined || req.body.quantity !== undefined) {
      const q = Number(req.body.required_quantity || req.body.quantity);
      if (isNaN(q) || q <= 0) return res.status(400).json({ success: false, message: 'Quantity must be > 0' });
      updates.required_quantity = q;
      updates.quantity = q;
    }
    if (req.body.unit) {
      const u = req.body.unit.toLowerCase().trim();
      if (!SUPPORTED_UNITS.includes(u as any)) {
        return res.status(400).json({ success: false, message: `Invalid unit: ${u}` });
      }
      updates.unit = u;
    }
    if (req.body.target_price !== undefined) {
      const p = Number(req.body.target_price);
      if (isNaN(p) || p < 0) return res.status(400).json({ success: false, message: 'target_price must be >= 0' });
      updates.target_price = p;
    }
    if (req.body.delivery_location) updates.delivery_location = req.body.delivery_location.trim();
    if (req.body.required_by_date !== undefined) updates.required_by_date = req.body.required_by_date;
    if (req.body.description !== undefined) updates.description = req.body.description;

    const { data, error } = await supabase
      .from('buyer_requirements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase UPDATE error:', error);
      return res.status(500).json({ success: false, message: 'Unable to update buyer requirement' });
    }

    res.json({ success: true, message: 'Buyer requirement updated successfully', data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// 6. PATCH /api/buyer-requirements/:id/status (Controlled status transition)
router.patch('/:id/status', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const user_id = req.user?.id;

    if (!status || !VALID_STATUSES.includes(status.toLowerCase() as any)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    const cleanStatus = status.toLowerCase();

    // Check existence
    const { data: existing, error: findError } = await supabase
      .from('buyer_requirements')
      .select('*')
      .eq('id', id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({ success: false, message: 'Buyer requirement not found' });
    }

    const isDemoUser = !user_id || user_id === '039b5a52-cfab-42df-9cbc-22214e210de5' || user_id === 'anonymous-demo-user';
    if (!isDemoUser && existing.buyer_id && existing.buyer_id !== user_id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this requirement' });
    }

    const { data, error } = await supabase
      .from('buyer_requirements')
      .update({ status: cleanStatus })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, message: 'Unable to update status' });
    }

    res.json({ success: true, message: `Buyer requirement status updated to ${cleanStatus}`, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

export default router;
