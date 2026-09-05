/**
 * Fieldora Demand Alerts & Notifications Routes
 */

import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

// 1. GET /api/demand-alerts (Get alerts for farmer)
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { unread, farmer_id, limit = '50' } = req.query;
    const authFarmerId = req.user?.id || farmer_id;

    let query = supabase
      .from('demand_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string, 10) || 50);

    if (authFarmerId && authFarmerId !== 'anonymous-demo-user') {
      query = query.eq('farmer_id', authFarmerId);
    }

    if (unread === 'true') {
      query = query.eq('read', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase GET demand_alerts error:', error);
      return res.status(500).json({ success: false, message: 'Unable to retrieve demand alerts' });
    }

    res.json({
      success: true,
      total: data?.length || 0,
      data: data || []
    });
  } catch (error: any) {
    console.error('Error fetching demand alerts:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// 2. PATCH /api/demand-alerts/:id/read (Mark alert as read)
router.patch('/:id/read', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const { data, error } = await supabase
      .from('demand_alerts')
      .update({ read: true })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Demand alert not found' });
    }

    res.json({
      success: true,
      message: 'Demand alert marked as read',
      data
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

export default router;
