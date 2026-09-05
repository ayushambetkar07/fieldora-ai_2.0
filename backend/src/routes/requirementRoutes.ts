import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

// GET all requirements
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('buyer_requirements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST new requirement
router.post('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('buyer_requirements')
      .insert([req.body])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
