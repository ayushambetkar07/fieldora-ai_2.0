/**
 * Fieldora Smart Direct Transport & Route Optimization Routes
 */
import { Router, Request, Response } from 'express';
import { getDynamicTransportOptions } from '../services/transportService.js';

const router = Router();

/**
 * POST /api/transport/options
 * Calculate dynamic transport options for a given route and cargo payload.
 */
router.post('/options', async (req: Request, res: Response) => {
  try {
    const {
      pickupLocation,
      destination,
      crop,
      quantity,
      quantityKg,
      unit
    } = req.body || {};

    const result = await getDynamicTransportOptions({
      pickupLocation: pickupLocation || 'Nashik',
      destination: destination || 'Mumbai',
      crop: crop || 'Produce',
      quantity: quantity !== undefined ? Number(quantity) : undefined,
      quantityKg: quantityKg !== undefined ? Number(quantityKg) : undefined,
      unit: unit || 'kg'
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error fetching transport options:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate transport options',
      message: error?.message || 'Internal server error'
    });
  }
});

/**
 * GET /api/transport/options
 * Query transport options via URL query params.
 */
router.get('/options', async (req: Request, res: Response) => {
  try {
    const {
      pickupLocation,
      pickup,
      destination,
      delivery,
      crop,
      quantity,
      quantityKg,
      unit
    } = req.query as Record<string, string>;

    const result = await getDynamicTransportOptions({
      pickupLocation: pickupLocation || pickup || 'Nashik',
      destination: destination || delivery || 'Mumbai',
      crop: crop || 'Produce',
      quantity: quantity ? Number(quantity) : undefined,
      quantityKg: quantityKg ? Number(quantityKg) : undefined,
      unit: unit || 'kg'
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error fetching transport options via GET:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate transport options',
      message: error?.message || 'Internal server error'
    });
  }
});

export default router;
