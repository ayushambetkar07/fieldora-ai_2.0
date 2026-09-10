import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
const SUPPORTED_UNITS = ['kg', 'quintal', 'ton', 'piece', 'crate'];
// 1. GET /api/produce-listings (Buyer Marketplace)
router.get('/', async (req, res) => {
    try {
        const { crop_name, location, min_price, max_price, quality_grade, page = '1', limit = '20' } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const start = (pageNum - 1) * limitNum;
        const end = start + limitNum - 1;
        // Default: only fetch verified and available listings
        let query = supabase
            .from('produce_listings')
            .select('*', { count: 'exact' })
            .eq('is_verified', true)
            .eq('status', 'Active')
            .order('created_at', { ascending: false })
            .range(start, end);
        // Apply filters
        if (crop_name && typeof crop_name === 'string') {
            query = query.ilike('crop', `%${crop_name.trim()}%`);
        }
        if (location && typeof location === 'string') {
            query = query.ilike('location', `%${location.trim()}%`);
        }
        if (quality_grade && typeof quality_grade === 'string') {
            query = query.eq('quality', quality_grade);
        }
        if (min_price && !isNaN(Number(min_price))) {
            query = query.gte('expected_price', Number(min_price));
        }
        if (max_price && !isNaN(Number(max_price))) {
            query = query.lte('expected_price', Number(max_price));
        }
        const { data, count, error } = await query;
        if (error) {
            console.error('Supabase GET error:', error);
            return res.status(500).json({ success: false, message: 'Unable to retrieve marketplace listings' });
        }
        res.json({
            success: true,
            data,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: count || 0,
                totalPages: count ? Math.ceil(count / limitNum) : 0
            }
        });
    }
    catch (error) {
        console.error('Error fetching listings:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});
// 2. GET /api/produce-listings/farmer/:farmerId (Farmer's Own Listings)
router.get('/farmer/:farmerId', requireAuth, async (req, res) => {
    try {
        const { farmerId } = req.params;
        // Authorization: User can only access their own listings
        if (req.user.id !== farmerId) {
            return res.status(403).json({ success: false, message: 'Forbidden: You can only view your own listings' });
        }
        const { data, error } = await supabase
            .from('produce_listings')
            .select('*')
            .eq('farmer_id', farmerId)
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Supabase GET farmer error:', error);
            return res.status(500).json({ success: false, message: 'Unable to retrieve your listings' });
        }
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});
// 3. GET /api/produce-listings/:id (Single Listing)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('produce_listings')
            .select('*')
            .eq('id', id)
            .single();
        if (error || !data) {
            return res.status(404).json({ success: false, message: 'Produce listing not found' });
        }
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});
// 4. POST /api/produce-listings (Create Listing)
router.post('/', requireAuth, async (req, res) => {
    try {
        const crop_name = req.body.crop_name || req.body.crop;
        const price_per_unit = req.body.price_per_unit || req.body.expected_price;
        const quality_grade = req.body.quality_grade || req.body.quality;
        const { variety, quantity, unit, location, harvest_date, description } = req.body;
        // The farmer ID is derived from the authenticated token, NEVER from req.body blindly
        const farmer_id = req.user.id;
        // Validation
        if (!crop_name || typeof crop_name !== 'string' || crop_name.trim() === '') {
            return res.status(400).json({ success: false, message: 'crop_name is required and cannot be empty' });
        }
        if (quantity === undefined || isNaN(Number(quantity)) || Number(quantity) <= 0) {
            return res.status(400).json({ success: false, message: 'quantity must be a number greater than 0' });
        }
        if (!unit || !SUPPORTED_UNITS.includes(unit.toLowerCase())) {
            return res.status(400).json({ success: false, message: `unit must be one of: ${SUPPORTED_UNITS.join(', ')}` });
        }
        if (price_per_unit === undefined || isNaN(Number(price_per_unit)) || Number(price_per_unit) < 0) {
            return res.status(400).json({ success: false, message: 'price_per_unit must be a non-negative number' });
        }
        if (!location || typeof location !== 'string' || location.trim() === '') {
            return res.status(400).json({ success: false, message: 'location is required and cannot be empty' });
        }
        const payload = {
            farmer_id,
            farmer_name: req.body.farmer_name || 'Rajendra Patel',
            farm_name: req.body.farm_name || 'Patel Agro Farms',
            crop: crop_name.trim(),
            variety: variety ? variety.trim() : null,
            quantity: Number(quantity),
            unit: unit.toLowerCase(),
            expected_price: Number(price_per_unit),
            location: location.trim(),
            harvest_date: harvest_date || null,
            description: description ? description.trim() : null,
            quality: quality_grade ? quality_grade.trim() : null,
            image_url: req.body.image_url || null,
            status: 'Active', // Defaults enforced by backend
            is_verified: true, // Defaults enforced by backend
        };
        const { data, error } = await supabase
            .from('produce_listings')
            .insert([payload])
            .select()
            .single();
        if (error) {
            console.error('Supabase INSERT error:', error);
            return res.status(500).json({ success: false, message: 'Unable to create produce listing' });
        }
        res.status(201).json({
            success: true,
            message: 'Produce listing created successfully',
            data
        });
    }
    catch (error) {
        console.error('Error creating listing:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});
// 5. PATCH /api/produce-listings/:id (Update Listing)
router.patch('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const farmer_id = req.user.id;
        const price_per_unit = req.body.price_per_unit || req.body.expected_price;
        const quality_grade = req.body.quality_grade || req.body.quality;
        const { quantity, description, location, status } = req.body;
        // First check if the listing exists and belongs to the farmer
        const { data: existingListing, error: fetchError } = await supabase
            .from('produce_listings')
            .select('farmer_id, status')
            .eq('id', id)
            .single();
        if (fetchError || !existingListing) {
            return res.status(404).json({ success: false, message: 'Produce listing not found' });
        }
        if (existingListing.farmer_id !== farmer_id) {
            return res.status(403).json({ success: false, message: 'Forbidden: You do not own this listing' });
        }
        // Do not allow updating if it is sold
        if (existingListing.status === 'sold' || existingListing.status === 'Completed') {
            return res.status(409).json({ success: false, message: 'Cannot update a listing that is already sold' });
        }
        const updates = {};
        if (quantity !== undefined && !isNaN(Number(quantity)) && Number(quantity) > 0)
            updates.quantity = Number(quantity);
        if (price_per_unit !== undefined && !isNaN(Number(price_per_unit)) && Number(price_per_unit) >= 0)
            updates.expected_price = Number(price_per_unit);
        if (description !== undefined)
            updates.description = description;
        if (location && typeof location === 'string')
            updates.location = location.trim();
        if (quality_grade !== undefined)
            updates.quality = quality_grade;
        if (status && ['Active', 'cancelled'].includes(status))
            updates.status = status;
        const { data, error } = await supabase
            .from('produce_listings')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            console.error('Supabase UPDATE error:', error);
            return res.status(500).json({ success: false, message: 'Unable to update produce listing' });
        }
        res.json({ success: true, message: 'Produce listing updated successfully', data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});
export default router;
