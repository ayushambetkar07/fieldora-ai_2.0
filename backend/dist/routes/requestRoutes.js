import { Router } from 'express';
import { supabase } from '../config/supabase.js';
const router = Router();
// GET all purchase requests
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('purchase_requests')
            .select('*')
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// POST send new purchase request
router.post('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('purchase_requests')
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
// PUT update request status (accept / reject)
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
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
        res.status(400).json({ success: false, message: error.message });
    }
});
export default router;
