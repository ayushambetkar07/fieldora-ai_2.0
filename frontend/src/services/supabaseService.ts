import { supabase } from '../lib/supabaseClient';
import { ProduceListing, BuyerRequirement, PurchaseRequest, OrderItem, MarketPricePoint } from '../types';
import { MOCK_PRODUCE, MOCK_REQUIREMENTS, MOCK_REQUESTS, MOCK_ORDERS } from '../data/mockData';
import { getCropImage } from '../data/cropMaster';

// --- PRODUCE LISTINGS ---

export const fetchProduceListings = async (): Promise<ProduceListing[]> => {
  try {
    const { data, error } = await supabase
      .from('produce_listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      console.warn('Supabase fetch error or empty, using cached/mock data:', error?.message);
      return MOCK_PRODUCE;
    }

    return data.map((item: any) => ({
      id: item.id,
      farmerId: item.farmer_id || 'FARMER-01',
      farmerName: item.farmer_name || 'Rajendra Patel',
      farmName: item.farm_name || 'Raj Farms & Agro Cooperative',
      isFarmerVerified: item.is_farmer_verified ?? true,
      crop: item.crop,
      variety: item.variety,
      category: item.category,
      quantity: Number(item.quantity),
      unit: item.unit || 'quintal',
      expectedPrice: Number(item.expected_price),
      marketReferencePrice: Number(item.market_reference_price || item.expected_price),
      location: item.location,
      quality: item.quality,
      harvestDate: item.harvest_date,
      deliveryOption: item.delivery_option,
      status: item.status || 'Active',
      description: item.description,
      imageUrl: getCropImage(item.crop, item.image_url),
      moisturePercentage: item.moisture_percentage ? Number(item.moisture_percentage) : undefined,
      createdDate: item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    }));
  } catch (err) {
    console.error('Failed to fetch produce from Supabase:', err);
    return MOCK_PRODUCE;
  }
};

export const createProduceListing = async (produce: Omit<ProduceListing, 'id' | 'createdDate'>): Promise<ProduceListing | null> => {
  try {
    const resolvedImageUrl = getCropImage(produce.crop, produce.imageUrl);
    const payload = {
      farmer_id: produce.farmerId || 'FARMER-01',
      farmer_name: produce.farmerName || 'Rajendra Patel',
      farm_name: produce.farmName || 'Raj Farms & Agro Cooperative',
      is_farmer_verified: produce.isFarmerVerified ?? true,
      crop: produce.crop,
      variety: produce.variety,
      category: produce.category,
      quantity: produce.quantity,
      unit: produce.unit,
      expected_price: produce.expectedPrice,
      market_reference_price: produce.marketReferencePrice || produce.expectedPrice,
      location: produce.location,
      quality: produce.quality,
      harvest_date: produce.harvestDate || new Date().toISOString().split('T')[0],
      delivery_option: produce.deliveryOption,
      status: produce.status || 'Active',
      description: produce.description,
      image_url: resolvedImageUrl,
      moisture_percentage: produce.moisturePercentage,
    };

    const { data, error } = await supabase
      .from('produce_listings')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error creating produce in Supabase:', error);
      return null;
    }

    return {
      id: data.id,
      farmerId: data.farmer_id || produce.farmerId || 'FARMER-01',
      farmerName: data.farmer_name || produce.farmerName,
      farmName: data.farm_name || produce.farmName,
      isFarmerVerified: data.is_farmer_verified ?? true,
      crop: data.crop,
      variety: data.variety,
      category: data.category,
      quantity: Number(data.quantity),
      unit: data.unit,
      expectedPrice: Number(data.expected_price),
      marketReferencePrice: Number(data.market_reference_price || data.expected_price),
      location: data.location,
      quality: data.quality,
      harvestDate: data.harvest_date,
      deliveryOption: data.delivery_option,
      status: data.status || 'Active',
      description: data.description,
      imageUrl: getCropImage(data.crop, data.image_url || resolvedImageUrl),
      moisturePercentage: data.moisture_percentage ? Number(data.moisture_percentage) : undefined,
      createdDate: new Date(data.created_at).toISOString().split('T')[0],
    };
  } catch (err) {
    console.error('Create produce error:', err);
    return null;
  }
};

export const deleteProduceListing = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('produce_listings').delete().eq('id', id);
    return !error;
  } catch (err) {
    console.error('Delete produce error:', err);
    return false;
  }
};

// --- BUYER REQUIREMENTS ---

export const fetchBuyerRequirements = async (): Promise<BuyerRequirement[]> => {
  try {
    const { data, error } = await supabase
      .from('buyer_requirements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return MOCK_REQUIREMENTS;
    }

    return data.map((item: any) => ({
      id: item.id,
      buyerId: item.buyer_id || 'BUYER-01',
      buyerName: item.buyer_name,
      companyName: item.company_name,
      isBuyerVerified: item.is_buyer_verified ?? true,
      crop: item.crop,
      variety: item.variety,
      quantity: Number(item.quantity),
      unit: item.unit || 'quintal',
      targetPrice: Number(item.target_price),
      qualityRequirements: item.quality_requirements,
      deliveryLocation: item.delivery_location,
      requiredByDate: item.required_by_date,
      paymentTerms: item.payment_terms,
      status: item.status,
      matchingScore: item.matching_score ?? 90,
      createdDate: item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    }));
  } catch (err) {
    console.error('Failed to fetch requirements:', err);
    return MOCK_REQUIREMENTS;
  }
};

export const createBuyerRequirement = async (req: Omit<BuyerRequirement, 'id' | 'createdDate'>): Promise<BuyerRequirement | null> => {
  try {
    const payload = {
      buyer_name: req.buyerName,
      company_name: req.companyName,
      is_buyer_verified: req.isBuyerVerified,
      crop: req.crop,
      variety: req.variety,
      quantity: req.quantity,
      unit: req.unit,
      target_price: req.targetPrice,
      quality_requirements: req.qualityRequirements,
      delivery_location: req.deliveryLocation,
      required_by_date: req.requiredByDate || new Date().toISOString().split('T')[0],
      payment_terms: req.paymentTerms,
      status: req.status || 'Open',
      matching_score: req.matchingScore || 92,
    };

    const { data, error } = await supabase
      .from('buyer_requirements')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error creating requirement in Supabase:', error);
      return null;
    }

    return {
      id: data.id,
      buyerId: data.buyer_id || req.buyerId,
      buyerName: data.buyer_name,
      companyName: data.company_name,
      isBuyerVerified: data.is_buyer_verified,
      crop: data.crop,
      variety: data.variety,
      quantity: Number(data.quantity),
      unit: data.unit,
      targetPrice: Number(data.target_price),
      qualityRequirements: data.quality_requirements,
      deliveryLocation: data.delivery_location,
      requiredByDate: data.required_by_date,
      paymentTerms: data.payment_terms,
      status: data.status,
      matchingScore: data.matching_score,
      createdDate: new Date(data.created_at).toISOString().split('T')[0],
    };
  } catch (err) {
    console.error('Create requirement error:', err);
    return null;
  }
};

// --- PURCHASE REQUESTS ---

export const fetchPurchaseRequests = async (): Promise<PurchaseRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('purchase_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return MOCK_REQUESTS;
    }

    return data.map((item: any) => ({
      id: item.id,
      produceId: item.produce_id,
      cropName: item.crop_name,
      buyerId: item.buyer_id || 'BUYER-01',
      buyerName: item.buyer_name,
      buyerCompany: item.buyer_company,
      isBuyerVerified: item.is_buyer_verified ?? true,
      farmerId: item.farmer_id || 'FARMER-01',
      farmerName: item.farmer_name,
      requestedQuantity: Number(item.requested_quantity),
      unit: item.unit || 'quintal',
      offeredPrice: Number(item.offered_price),
      deliveryLocation: item.delivery_location,
      requiredDate: item.required_date,
      message: item.message,
      status: item.status,
      createdDate: item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    }));
  } catch (err) {
    console.error('Fetch requests error:', err);
    return MOCK_REQUESTS;
  }
};

export const createPurchaseRequest = async (req: Omit<PurchaseRequest, 'id' | 'createdDate'>): Promise<PurchaseRequest | null> => {
  try {
    const payload = {
      crop_name: req.cropName,
      buyer_name: req.buyerName,
      buyer_company: req.buyerCompany,
      is_buyer_verified: req.isBuyerVerified,
      farmer_name: req.farmerName,
      requested_quantity: req.requestedQuantity,
      unit: req.unit,
      offered_price: req.offeredPrice,
      delivery_location: req.deliveryLocation,
      required_date: req.requiredDate || new Date().toISOString().split('T')[0],
      message: req.message || '',
      status: req.status || 'Pending',
    };

    const { data, error } = await supabase
      .from('purchase_requests')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error creating purchase request in Supabase:', error);
      return null;
    }

    return {
      id: data.id,
      produceId: data.produce_id || req.produceId,
      cropName: data.crop_name,
      buyerId: data.buyer_id || req.buyerId,
      buyerName: data.buyer_name,
      buyerCompany: data.buyer_company,
      isBuyerVerified: data.is_buyer_verified,
      farmerId: data.farmer_id || req.farmerId,
      farmerName: data.farmer_name,
      requestedQuantity: Number(data.requested_quantity),
      unit: data.unit,
      offeredPrice: Number(data.offered_price),
      deliveryLocation: data.delivery_location,
      requiredDate: data.required_date,
      message: data.message,
      status: data.status,
      createdDate: new Date(data.created_at).toISOString().split('T')[0],
    };
  } catch (err) {
    console.error('Create request error:', err);
    return null;
  }
};

export const updateRequestStatus = async (requestId: string, status: 'Accepted' | 'Rejected'): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('purchase_requests')
      .update({ status })
      .eq('id', requestId);

    return !error;
  } catch (err) {
    console.error('Update request error:', err);
    return false;
  }
};

// --- ORDERS ---

export const fetchOrders = async (): Promise<OrderItem[]> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return MOCK_ORDERS;
    }

    return data.map((item: any) => ({
      id: item.id,
      orderNumber: item.order_number,
      requestId: item.request_id,
      produceId: item.produce_id,
      crop: item.crop,
      variety: item.variety || 'Standard Quality',
      quantity: Number(item.quantity),
      unit: item.unit || 'quintal',
      pricePerUnit: Number(item.price_per_unit),
      totalAmount: Number(item.total_amount),
      farmerId: item.farmer_id || 'FARMER-01',
      farmerName: item.farmer_name,
      farmerFarm: item.farmer_farm || 'Cooperative Producer Farm',
      buyerId: item.buyer_id || 'BUYER-01',
      buyerName: item.buyer_name,
      buyerCompany: item.buyer_company || 'Enterprise Buyer',
      deliveryLocation: item.delivery_location,
      orderDate: item.order_date || new Date().toISOString().split('T')[0],
      expectedDeliveryDate: item.expected_delivery_date || new Date().toISOString().split('T')[0],
      status: item.status,
      paymentStatus: item.payment_status,
      transportConfirmed: item.transport_confirmed ?? (item.status === 'Transport Confirmed' || item.status === 'In Transit' || item.status === 'Arrived' || item.status === 'Quality Verified' || item.status === 'Completed'),
      transportConfirmedAt: item.transport_confirmed_at,
      transportConfirmedBy: item.transport_confirmed_by,
      arrivedAt: item.arrived_at,
      arrivedBy: item.arrived_by,
      arrivalRemarks: item.arrival_remarks,
      actualReceivedQuantity: item.actual_received_quantity !== null && item.actual_received_quantity !== undefined ? Number(item.actual_received_quantity) : undefined,
      actualQuantityUnit: item.actual_quantity_unit,
      qualityGrade: item.quality_grade,
      assayResult: item.assay_result,
      assayNotes: item.assay_notes,
      verificationRemarks: item.verification_remarks,
      verifiedAt: item.verified_at,
      verifiedBy: item.verified_by,
      payoutStatus: item.payout_status,
      payoutAmount: item.payout_amount !== null && item.payout_amount !== undefined ? Number(item.payout_amount) : undefined,
      payoutReleasedAt: item.payout_released_at,
      payoutReleasedBy: item.payout_released_by,
      payoutReference: item.payout_reference,
      trackingSteps: item.tracking_steps || [],
    }));
  } catch (err) {
    console.error('Fetch orders error:', err);
    return MOCK_ORDERS;
  }
};

export const createOrder = async (order: Omit<OrderItem, 'id'>): Promise<OrderItem | null> => {
  try {
    const payload: any = {
      order_number: order.orderNumber,
      crop: order.crop,
      variety: order.variety,
      quantity: order.quantity,
      unit: order.unit,
      price_per_unit: order.pricePerUnit,
      total_amount: order.totalAmount,
      farmer_id: order.farmerId,
      farmer_name: order.farmerName,
      farmer_farm: order.farmerFarm,
      buyer_id: order.buyerId,
      buyer_name: order.buyerName,
      buyer_company: order.buyerCompany,
      delivery_location: order.deliveryLocation,
      order_date: order.orderDate,
      expected_delivery_date: order.expectedDeliveryDate,
      status: order.status,
      payment_status: order.paymentStatus,
      tracking_steps: order.trackingSteps,
    };

    const { data, error } = await supabase
      .from('orders')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error creating order in Supabase:', error);
      return null;
    }

    return {
      id: data.id,
      orderNumber: data.order_number,
      requestId: data.request_id,
      produceId: data.produce_id,
      crop: data.crop,
      variety: data.variety,
      quantity: Number(data.quantity),
      unit: data.unit,
      pricePerUnit: Number(data.price_per_unit),
      totalAmount: Number(data.total_amount),
      farmerId: data.farmer_id || order.farmerId,
      farmerName: data.farmer_name,
      farmerFarm: data.farmer_farm,
      buyerId: data.buyer_id || order.buyerId,
      buyerName: data.buyer_name,
      buyerCompany: data.buyer_company,
      deliveryLocation: data.delivery_location,
      orderDate: data.order_date,
      expectedDeliveryDate: data.expected_delivery_date,
      status: data.status,
      paymentStatus: data.payment_status,
      trackingSteps: data.tracking_steps,
    };
  } catch (err) {
    console.error('Create order error:', err);
    return null;
  }
};

// --- REAL ORDER & ESCROW ACTIONS (MARK ARRIVED, VERIFY, RELEASE PAYOUT) ---

export const markOrderArrivedApi = async (orderId: string, arrivalData: { arrivedBy?: string; arrivalRemarks?: string }): Promise<OrderItem | null> => {
  try {
    // 1. Try backend endpoint first
    try {
      const res = await fetch(`/api/orders/${orderId}/arrive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          arrived_by: arrivalData.arrivedBy,
          arrival_remarks: arrivalData.arrivalRemarks
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return {
            id: json.data.id || orderId,
            orderNumber: json.data.order_number || json.data.orderNumber,
            requestId: json.data.request_id || json.data.requestId,
            produceId: json.data.produce_id || json.data.produceId,
            crop: json.data.crop,
            variety: json.data.variety,
            quantity: Number(json.data.quantity),
            unit: json.data.unit,
            pricePerUnit: Number(json.data.price_per_unit || json.data.pricePerUnit),
            totalAmount: Number(json.data.total_amount || json.data.totalAmount),
            farmerId: json.data.farmer_id || json.data.farmerId,
            farmerName: json.data.farmer_name || json.data.farmerName,
            farmerFarm: json.data.farmer_farm || json.data.farmerFarm,
            buyerId: json.data.buyer_id || json.data.buyerId,
            buyerName: json.data.buyer_name || json.data.buyerName,
            buyerCompany: json.data.buyer_company || json.data.buyerCompany,
            deliveryLocation: json.data.delivery_location || json.data.deliveryLocation,
            orderDate: json.data.order_date || json.data.orderDate,
            expectedDeliveryDate: json.data.expected_delivery_date || json.data.expectedDeliveryDate,
            status: json.data.status,
            paymentStatus: json.data.payment_status || json.data.paymentStatus,
            arrivedAt: json.data.arrived_at || json.data.arrivedAt,
            arrivedBy: json.data.arrived_by || json.data.arrivedBy,
            arrivalRemarks: json.data.arrival_remarks || json.data.arrivalRemarks,
            trackingSteps: json.data.tracking_steps || json.data.trackingSteps,
          };
        }
      }
    } catch {
      // Fallback to Supabase
    }

    // 2. Direct Supabase update
    const arrivalIso = new Date().toISOString();
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'Arrived',
        arrived_at: arrivalIso,
        arrived_by: arrivalData.arrivedBy || 'Destination Hub Inspector',
        arrival_remarks: arrivalData.arrivalRemarks || 'Shipment arrived at destination hub'
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error || !data) {
      console.warn('Supabase update fallback error for mark arrive:', error);
      return null;
    }

    return {
      id: data.id,
      orderNumber: data.order_number,
      requestId: data.request_id,
      produceId: data.produce_id,
      crop: data.crop,
      variety: data.variety,
      quantity: Number(data.quantity),
      unit: data.unit,
      pricePerUnit: Number(data.price_per_unit),
      totalAmount: Number(data.total_amount),
      farmerId: data.farmer_id,
      farmerName: data.farmer_name,
      farmerFarm: data.farmer_farm,
      buyerId: data.buyer_id,
      buyerName: data.buyer_name,
      buyerCompany: data.buyer_company,
      deliveryLocation: data.delivery_location,
      orderDate: data.order_date,
      expectedDeliveryDate: data.expected_delivery_date,
      status: data.status,
      paymentStatus: data.payment_status,
      arrivedAt: data.arrived_at,
      arrivedBy: data.arrived_by,
      arrivalRemarks: data.arrival_remarks,
      trackingSteps: data.tracking_steps,
    };
  } catch (err) {
    console.error('Mark order arrived error:', err);
    return null;
  }
};

export const verifyOrderQualityApi = async (
  orderId: string,
  data: {
    actualReceivedQuantity: number;
    actualQuantityUnit?: string;
    qualityGrade: string;
    assayResult: string;
    assayNotes?: string;
    verificationRemarks?: string;
    verifiedBy?: string;
  }
): Promise<{ success: boolean; order?: OrderItem; error?: string }> => {
  try {
    // 1. Try backend endpoint
    try {
      const res = await fetch(`/api/orders/${orderId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actual_received_quantity: data.actualReceivedQuantity,
          actual_quantity_unit: data.actualQuantityUnit,
          quality_grade: data.qualityGrade,
          assay_result: data.assayResult,
          assay_notes: data.assayNotes,
          verification_remarks: data.verificationRemarks,
          verified_by: data.verifiedBy
        })
      });

      const json = await res.json();
      if (res.ok && json.success && json.data) {
        const orderData = json.data.order || json.data;
        return {
          success: true,
          order: {
            id: orderData.id || orderId,
            orderNumber: orderData.order_number || orderData.orderNumber,
            requestId: orderData.request_id || orderData.requestId,
            produceId: orderData.produce_id || orderData.produceId,
            crop: orderData.crop,
            variety: orderData.variety,
            quantity: Number(orderData.quantity),
            unit: orderData.unit,
            pricePerUnit: Number(orderData.price_per_unit || orderData.pricePerUnit),
            totalAmount: Number(orderData.total_amount || orderData.totalAmount),
            farmerId: orderData.farmer_id || orderData.farmerId,
            farmerName: orderData.farmer_name || orderData.farmerName,
            farmerFarm: orderData.farmer_farm || orderData.farmerFarm,
            buyerId: orderData.buyer_id || orderData.buyerId,
            buyerName: orderData.buyer_name || orderData.buyerName,
            buyerCompany: orderData.buyer_company || orderData.buyerCompany,
            deliveryLocation: orderData.delivery_location || orderData.deliveryLocation,
            orderDate: orderData.order_date || orderData.orderDate,
            expectedDeliveryDate: orderData.expected_delivery_date || orderData.expectedDeliveryDate,
            status: orderData.status,
            paymentStatus: orderData.payment_status || orderData.paymentStatus,
            arrivedAt: orderData.arrived_at || orderData.arrivedAt,
            arrivedBy: orderData.arrived_by || orderData.arrivedBy,
            arrivalRemarks: orderData.arrival_remarks || orderData.arrivalRemarks,
            actualReceivedQuantity: orderData.actual_received_quantity !== undefined ? Number(orderData.actual_received_quantity) : data.actualReceivedQuantity,
            actualQuantityUnit: orderData.actual_quantity_unit || data.actualQuantityUnit,
            qualityGrade: orderData.quality_grade || data.qualityGrade,
            assayResult: orderData.assay_result || data.assayResult,
            assayNotes: orderData.assay_notes || data.assayNotes,
            verificationRemarks: orderData.verification_remarks || data.verificationRemarks,
            verifiedAt: orderData.verified_at || new Date().toISOString(),
            verifiedBy: orderData.verified_by || data.verifiedBy,
            trackingSteps: orderData.tracking_steps || orderData.trackingSteps,
          }
        };
      } else if (!res.ok) {
        return { success: false, error: json.message || 'Verification failed on server' };
      }
    } catch {
      // Direct Supabase fallback
    }

    const isPassed = data.assayResult.toLowerCase() === 'passed';
    const verifiedIso = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('orders')
      .update({
        status: isPassed ? 'Quality Verified' : 'Disputed',
        actual_received_quantity: data.actualReceivedQuantity,
        actual_quantity_unit: data.actualQuantityUnit || 'kg',
        quality_grade: data.qualityGrade,
        assay_result: isPassed ? 'Passed' : 'Failed',
        assay_notes: data.assayNotes || null,
        verification_remarks: data.verificationRemarks || null,
        verified_at: verifiedIso,
        verified_by: data.verifiedBy || 'Quality Verifier'
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error || !updated) {
      return { success: false, error: error?.message || 'Database update error during verification' };
    }

    return {
      success: true,
      order: {
        id: updated.id,
        orderNumber: updated.order_number,
        requestId: updated.request_id,
        produceId: updated.produce_id,
        crop: updated.crop,
        variety: updated.variety,
        quantity: Number(updated.quantity),
        unit: updated.unit,
        pricePerUnit: Number(updated.price_per_unit),
        totalAmount: Number(updated.total_amount),
        farmerId: updated.farmer_id,
        farmerName: updated.farmer_name,
        farmerFarm: updated.farmer_farm,
        buyerId: updated.buyer_id,
        buyerName: updated.buyer_name,
        buyerCompany: updated.buyer_company,
        deliveryLocation: updated.delivery_location,
        orderDate: updated.order_date,
        expectedDeliveryDate: updated.expected_delivery_date,
        status: updated.status,
        paymentStatus: updated.payment_status,
        arrivedAt: updated.arrived_at,
        arrivedBy: updated.arrived_by,
        arrivalRemarks: updated.arrival_remarks,
        actualReceivedQuantity: Number(updated.actual_received_quantity),
        actualQuantityUnit: updated.actual_quantity_unit,
        qualityGrade: updated.quality_grade,
        assayResult: updated.assay_result,
        assayNotes: updated.assay_notes,
        verificationRemarks: updated.verification_remarks,
        verifiedAt: updated.verified_at,
        verifiedBy: updated.verified_by,
        trackingSteps: updated.tracking_steps,
      }
    };
  } catch (err: any) {
    console.error('Verify order quality error:', err);
    return { success: false, error: err.message || 'Verification exception' };
  }
};

export const releaseOrderPayoutApi = async (orderId: string, data?: { notes?: string }): Promise<{ success: boolean; order?: OrderItem; error?: string }> => {
  try {
    // 1. Try backend endpoint
    try {
      const res = await fetch(`/api/orders/${orderId}/release-payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: data?.notes,
          idempotency_key: `payout-${orderId}-${Date.now()}`
        })
      });

      const json = await res.json();
      if (res.ok && json.success && json.data) {
        const orderData = json.data.order || json.data;
        return {
          success: true,
          order: {
            id: orderData.id || orderId,
            orderNumber: orderData.order_number || orderData.orderNumber,
            requestId: orderData.request_id || orderData.requestId,
            produceId: orderData.produce_id || orderData.produceId,
            crop: orderData.crop,
            variety: orderData.variety,
            quantity: Number(orderData.quantity),
            unit: orderData.unit,
            pricePerUnit: Number(orderData.price_per_unit || orderData.pricePerUnit),
            totalAmount: Number(orderData.total_amount || orderData.totalAmount),
            farmerId: orderData.farmer_id || orderData.farmerId,
            farmerName: orderData.farmer_name || orderData.farmerName,
            farmerFarm: orderData.farmer_farm || orderData.farmerFarm,
            buyerId: orderData.buyer_id || orderData.buyerId,
            buyerName: orderData.buyer_name || orderData.buyerName,
            buyerCompany: orderData.buyer_company || orderData.buyerCompany,
            deliveryLocation: orderData.delivery_location || orderData.deliveryLocation,
            orderDate: orderData.order_date || orderData.orderDate,
            expectedDeliveryDate: orderData.expected_delivery_date || orderData.expectedDeliveryDate,
            status: orderData.status,
            paymentStatus: orderData.payment_status || orderData.paymentStatus,
            payoutStatus: orderData.payout_status || 'Released',
            payoutAmount: Number(orderData.payout_amount || orderData.total_amount || orderData.totalAmount),
            payoutReleasedAt: orderData.payout_released_at || new Date().toISOString(),
            payoutReference: orderData.payout_reference,
            trackingSteps: orderData.tracking_steps || orderData.trackingSteps,
          }
        };
      } else if (!res.ok) {
        return { success: false, error: json.message || 'Payout release rejected by server' };
      }
    } catch {
      // Fallback to Supabase
    }

    const { data: updated, error } = await supabase
      .from('orders')
      .update({
        status: 'Completed',
        payment_status: 'Released',
        payout_status: 'Released',
        payout_released_at: new Date().toISOString(),
        payout_reference: `TX-PAY-${Date.now().toString().slice(-8)}`
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error || !updated) {
      return { success: false, error: error?.message || 'Database error during payout release' };
    }

    return {
      success: true,
      order: {
        id: updated.id,
        orderNumber: updated.order_number,
        requestId: updated.request_id,
        produceId: updated.produce_id,
        crop: updated.crop,
        variety: updated.variety,
        quantity: Number(updated.quantity),
        unit: updated.unit,
        pricePerUnit: Number(updated.price_per_unit),
        totalAmount: Number(updated.total_amount),
        farmerId: updated.farmer_id,
        farmerName: updated.farmer_name,
        farmerFarm: updated.farmer_farm,
        buyerId: updated.buyer_id,
        buyerName: updated.buyer_name,
        buyerCompany: updated.buyer_company,
        deliveryLocation: updated.delivery_location,
        orderDate: updated.order_date,
        expectedDeliveryDate: updated.expected_delivery_date,
        status: updated.status,
        paymentStatus: updated.payment_status,
        payoutStatus: updated.payout_status,
        payoutAmount: Number(updated.payout_amount || updated.total_amount),
        payoutReleasedAt: updated.payout_released_at,
        payoutReference: updated.payout_reference,
        trackingSteps: updated.tracking_steps,
      }
    };
  } catch (err: any) {
    console.error('Release payout error:', err);
    return { success: false, error: err.message || 'Payout release exception' };
  }
};

export const lockOrderEscrowApi = async (orderId: string, data?: { depositAmount?: number; notes?: string }): Promise<OrderItem | null> => {
  try {
    // 1. Try backend
    try {
      const res = await fetch(`/api/orders/${orderId}/escrow/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data || {})
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const ord = json.data.order || json.data;
          return {
            id: ord.id || orderId,
            orderNumber: ord.order_number || ord.orderNumber,
            requestId: ord.request_id || ord.requestId,
            produceId: ord.produce_id || ord.produceId,
            crop: ord.crop,
            variety: ord.variety,
            quantity: Number(ord.quantity),
            unit: ord.unit,
            pricePerUnit: Number(ord.price_per_unit || ord.pricePerUnit),
            totalAmount: Number(ord.total_amount || ord.totalAmount),
            farmerId: ord.farmer_id || ord.farmerId,
            farmerName: ord.farmer_name || ord.farmerName,
            farmerFarm: ord.farmer_farm || ord.farmerFarm,
            buyerId: ord.buyer_id || ord.buyerId,
            buyerName: ord.buyer_name || ord.buyerName,
            buyerCompany: ord.buyer_company || ord.buyerCompany,
            deliveryLocation: ord.delivery_location || ord.deliveryLocation,
            orderDate: ord.order_date || ord.orderDate,
            expectedDeliveryDate: ord.expected_delivery_date || ord.expectedDeliveryDate,
            status: ord.status,
            paymentStatus: ord.payment_status || ord.paymentStatus,
            trackingSteps: ord.tracking_steps || ord.trackingSteps,
          };
        }
      }
    } catch {
      // Fallback
    }

    const { data: updated } = await supabase
      .from('orders')
      .update({
        payment_status: 'Escrow Locked',
        escrow_locked_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (!updated) return null;

    return {
      id: updated.id,
      orderNumber: updated.order_number,
      requestId: updated.request_id,
      produceId: updated.produce_id,
      crop: updated.crop,
      variety: updated.variety,
      quantity: Number(updated.quantity),
      unit: updated.unit,
      pricePerUnit: Number(updated.price_per_unit),
      totalAmount: Number(updated.total_amount),
      farmerId: updated.farmer_id,
      farmerName: updated.farmer_name,
      farmerFarm: updated.farmer_farm,
      buyerId: updated.buyer_id,
      buyerName: updated.buyer_name,
      buyerCompany: updated.buyer_company,
      deliveryLocation: updated.delivery_location,
      orderDate: updated.order_date,
      expectedDeliveryDate: updated.expected_delivery_date,
      status: updated.status,
      paymentStatus: updated.payment_status,
      transportConfirmed: updated.transport_confirmed ?? true,
      trackingSteps: updated.tracking_steps,
    };
  } catch (err) {
    console.error('Lock escrow error:', err);
    return null;
  }
};

export const confirmFarmerTransportApi = async (orderId: string, data?: { confirmedBy?: string; notes?: string }): Promise<OrderItem | null> => {
  try {
    try {
      const res = await fetch(`/api/orders/${orderId}/confirm-transport`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'farmer' },
        body: JSON.stringify({
          user_role: 'farmer',
          confirmed_by: data?.confirmedBy,
          notes: data?.notes
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const ord = json.data;
          return {
            id: ord.id || orderId,
            orderNumber: ord.order_number || ord.orderNumber,
            requestId: ord.request_id || ord.requestId,
            produceId: ord.produce_id || ord.produceId,
            crop: ord.crop,
            variety: ord.variety,
            quantity: Number(ord.quantity),
            unit: ord.unit,
            pricePerUnit: Number(ord.price_per_unit || ord.pricePerUnit),
            totalAmount: Number(ord.total_amount || ord.totalAmount),
            farmerId: ord.farmer_id || ord.farmerId,
            farmerName: ord.farmer_name || ord.farmerName,
            farmerFarm: ord.farmer_farm || ord.farmerFarm,
            buyerId: ord.buyer_id || ord.buyerId,
            buyerName: ord.buyer_name || ord.buyerName,
            buyerCompany: ord.buyer_company || ord.buyerCompany,
            deliveryLocation: ord.delivery_location || ord.deliveryLocation,
            orderDate: ord.order_date || ord.orderDate,
            expectedDeliveryDate: ord.expected_delivery_date || ord.expectedDeliveryDate,
            status: ord.status,
            paymentStatus: ord.payment_status || ord.paymentStatus,
            transportConfirmed: ord.transport_confirmed ?? true,
            transportConfirmedAt: ord.transport_confirmed_at,
            transportConfirmedBy: ord.transport_confirmed_by,
            trackingSteps: ord.tracking_steps || ord.trackingSteps,
          };
        }
      }
    } catch {
      // Fallback
    }

    const { data: updated, error } = await supabase
      .from('orders')
      .update({
        status: 'Transport Confirmed',
        transport_confirmed: true,
        transport_confirmed_at: new Date().toISOString(),
        transport_confirmed_by: data?.confirmedBy || 'Farmer'
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error || !updated) return null;

    return {
      id: updated.id,
      orderNumber: updated.order_number,
      requestId: updated.request_id,
      produceId: updated.produce_id,
      crop: updated.crop,
      variety: updated.variety,
      quantity: Number(updated.quantity),
      unit: updated.unit,
      pricePerUnit: Number(updated.price_per_unit),
      totalAmount: Number(updated.total_amount),
      farmerId: updated.farmer_id,
      farmerName: updated.farmer_name,
      farmerFarm: updated.farmer_farm,
      buyerId: updated.buyer_id,
      buyerName: updated.buyer_name,
      buyerCompany: updated.buyer_company,
      deliveryLocation: updated.delivery_location,
      orderDate: updated.order_date,
      expectedDeliveryDate: updated.expected_delivery_date,
      status: updated.status,
      paymentStatus: updated.payment_status,
      transportConfirmed: updated.transport_confirmed ?? true,
      transportConfirmedAt: updated.transport_confirmed_at,
      transportConfirmedBy: updated.transport_confirmed_by,
      trackingSteps: updated.tracking_steps,
    };
  } catch (err) {
    console.error('Confirm transport error:', err);
    return null;
  }
};

export const dispatchOrderTransportApi = async (orderId: string, dispatchData?: {
  vehicleId?: string;
  vehicleName?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  pickupLocation?: string;
  deliveryLocation?: string;
  pickupNodeId?: string;
  deliveryNodeId?: string;
  routeId?: string;
  estimatedDistanceKm?: number;
  estimatedDurationMinutes?: number;
  estimatedTollCost?: number;
}): Promise<OrderItem | null> => {
  try {
    try {
      const res = await fetch(`/api/orders/${orderId}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'buyer' },
        body: JSON.stringify({
          user_role: 'buyer',
          vehicle_id: dispatchData?.vehicleId || 'veh-default',
          vehicle_name: dispatchData?.vehicleName || 'Fieldora Smart Logistics',
          vehicle_type: dispatchData?.vehicleType || 'Eicher 14ft Closed Container',
          vehicle_number: dispatchData?.vehicleNumber || 'MH-04-AZ-2084',
          driver_name: dispatchData?.driverName || 'Suresh Jadhav',
          driver_phone: dispatchData?.driverPhone || '+91 98201 54321',
          pickup_location: dispatchData?.pickupLocation,
          delivery_location: dispatchData?.deliveryLocation,
          pickup_node_id: dispatchData?.pickupNodeId,
          delivery_node_id: dispatchData?.deliveryNodeId,
          route_id: dispatchData?.routeId,
          estimated_distance_km: dispatchData?.estimatedDistanceKm,
          estimated_duration_minutes: dispatchData?.estimatedDurationMinutes,
          estimated_toll_cost: dispatchData?.estimatedTollCost,
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const ord = json.data.order || json.data;
          return {
            id: ord.id || orderId,
            orderNumber: ord.order_number || ord.orderNumber,
            requestId: ord.request_id || ord.requestId,
            produceId: ord.produce_id || ord.produceId,
            crop: ord.crop,
            variety: ord.variety,
            quantity: Number(ord.quantity),
            unit: ord.unit,
            pricePerUnit: Number(ord.price_per_unit || ord.pricePerUnit),
            totalAmount: Number(ord.total_amount || ord.totalAmount),
            farmerId: ord.farmer_id || ord.farmerId,
            farmerName: ord.farmer_name || ord.farmerName,
            farmerFarm: ord.farmer_farm || ord.farmerFarm,
            buyerId: ord.buyer_id || ord.buyerId,
            buyerName: ord.buyer_name || ord.buyerName,
            buyerCompany: ord.buyer_company || ord.buyerCompany,
            deliveryLocation: ord.delivery_location || ord.deliveryLocation,
            orderDate: ord.order_date || ord.orderDate,
            expectedDeliveryDate: ord.expected_delivery_date || ord.expectedDeliveryDate,
            status: 'In Transit',
            paymentStatus: ord.payment_status || ord.paymentStatus,
            transportConfirmed: true,
            trackingSteps: ord.tracking_steps || ord.trackingSteps,
          };
        }
      }
    } catch {
      // Fallback
    }

    const { data: updated, error } = await supabase
      .from('orders')
      .update({
        status: 'In Transit',
        dispatched_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error || !updated) return null;

    return {
      id: updated.id,
      orderNumber: updated.order_number,
      requestId: updated.request_id,
      produceId: updated.produce_id,
      crop: updated.crop,
      variety: updated.variety,
      quantity: Number(updated.quantity),
      unit: updated.unit,
      pricePerUnit: Number(updated.price_per_unit),
      totalAmount: Number(updated.total_amount),
      farmerId: updated.farmer_id,
      farmerName: updated.farmer_name,
      farmerFarm: updated.farmer_farm,
      buyerId: updated.buyer_id,
      buyerName: updated.buyer_name,
      buyerCompany: updated.buyer_company,
      deliveryLocation: updated.delivery_location,
      orderDate: updated.order_date,
      expectedDeliveryDate: updated.expected_delivery_date,
      status: updated.status,
      paymentStatus: updated.payment_status,
      transportConfirmed: true,
      trackingSteps: updated.tracking_steps,
    };
  } catch (err) {
    console.error('Dispatch transport error:', err);
    return null;
  }
};

export const fetchOrderDispatchApi = async (orderId: string): Promise<any | null> => {
  try {
    const res = await fetch(`/api/orders/${orderId}/dispatch`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) return json.data;
    }
  } catch {}

  try {
    const { data } = await supabase
      .from('order_dispatches')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data || null;
  } catch {
    return null;
  }
};

// --- MARKET REFERENCE PRICES (REAL APMC DATA) ---

function formatMarketPriceItem(item: any): MarketPricePoint {
  const currentPrice = Number(item.current_price ?? item.currentPrice ?? item.average_price ?? item.averagePrice ?? 0);
  const lowestPrice = Number(item.lowest_price ?? item.lowestPrice ?? (currentPrice * 0.85));
  const highestPrice = Number(item.highest_price ?? item.highestPrice ?? (currentPrice * 1.15));
  const averagePrice = Number(item.average_price ?? item.averagePrice ?? currentPrice);
  const previousPrice = Number(item.previous_price ?? item.previousPrice ?? lowestPrice);
  const changePercent = Number(
    item.change_percent !== null && item.change_percent !== undefined
      ? Number(item.change_percent)
      : item.changePercent !== null && item.changePercent !== undefined
      ? Number(item.changePercent)
      : previousPrice
      ? Number(((currentPrice - previousPrice) / previousPrice * 100).toFixed(1))
      : 0
  );
  const arrivalVolume = Number(item.arrival_volume ?? item.arrivalVolume ?? 0);

  let historical30Days = item.historical_30_days || item.historical30Days;
  if (!historical30Days || !Array.isArray(historical30Days) || historical30Days.length === 0) {
    const p1 = lowestPrice;
    const p2 = Math.round(lowestPrice + (averagePrice - lowestPrice) * 0.3);
    const p3 = Math.round(lowestPrice + (averagePrice - lowestPrice) * 0.6);
    const p4 = averagePrice;
    const p5 = previousPrice;
    const p6 = Math.round(previousPrice + (currentPrice - previousPrice) * 0.5);
    const p7 = currentPrice;
    const volMT = Math.round(arrivalVolume > 0 ? arrivalVolume / 10 : 100);

    historical30Days = [
      { date: '01 Aug', price: p1, volumeMT: Math.round(volMT * 0.85) },
      { date: '06 Aug', price: p2, volumeMT: Math.round(volMT * 0.9) },
      { date: '11 Aug', price: p3, volumeMT: Math.round(volMT * 0.88) },
      { date: '16 Aug', price: p4, volumeMT: Math.round(volMT * 0.95) },
      { date: '21 Aug', price: p5, volumeMT: Math.round(volMT * 0.92) },
      { date: '26 Aug', price: p6, volumeMT: Math.round(volMT * 0.98) },
      { date: '05 Sep', price: p7, volumeMT: volMT },
    ];
  }

  let nearbyMarkets = item.nearby_markets || item.nearbyMarkets;
  if (!nearbyMarkets || !Array.isArray(nearbyMarkets) || nearbyMarkets.length === 0) {
    const isMumbai = (item.mandi || '').toLowerCase().includes('mumbai') || (item.mandi || '').toLowerCase().includes('vashi');
    const primaryName = item.mandi || 'Mumbai APMC (Vashi)';

    nearbyMarkets = [
      { 
        mandi: primaryName, 
        distanceKm: 0, 
        price: currentPrice, 
        changePercent: Number(changePercent.toFixed(1)), 
        trend: (item.price_trend || item.priceTrend || (changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'stable')) as 'up' | 'down' | 'stable'
      },
      { 
        mandi: isMumbai ? 'Pune Market Yard' : 'Mumbai APMC (Vashi)', 
        distanceKm: 145, 
        price: Math.round(currentPrice * (isMumbai ? 0.96 : 1.05)), 
        changePercent: Number((changePercent * 0.6).toFixed(1)), 
        trend: 'up' as const
      },
      { 
        mandi: 'Nashik APMC', 
        distanceKm: 165, 
        price: Math.round(currentPrice * 0.94), 
        changePercent: Number((changePercent * 0.8).toFixed(1)), 
        trend: (changePercent >= 0 ? 'up' : 'down') as 'up' | 'down'
      },
      { 
        mandi: 'Lasalgaon Mandi', 
        distanceKm: 190, 
        price: Math.round(currentPrice * 0.97), 
        changePercent: Number((changePercent * 0.5).toFixed(1)), 
        trend: 'up' as const
      },
    ];
  }

  return {
    id: item.id || `MKT-${item.crop}`,
    crop: item.crop,
    variety: item.variety || '',
    mandi: item.mandi || 'Mumbai APMC (Vashi)',
    state: item.state || 'Maharashtra',
    currentPrice,
    previousPrice,
    changePercent: Number(changePercent.toFixed(1)),
    highestPrice,
    lowestPrice,
    averagePrice,
    priceTrend: (item.price_trend || item.priceTrend || (changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'stable')) as 'up' | 'down' | 'stable',
    historical30Days,
    nearbyMarkets,
    insightSummary: item.insight_summary || item.insightSummary || `${item.crop} (${item.variety || ''}) modal rate ₹${currentPrice}/q at ${item.mandi}.`,
    recommendation: item.recommendation || `Official APMC modal rate: ₹${currentPrice}/q with recorded arrivals of ${arrivalVolume} Qtl.`,
  };
}

export const fetchMarketPrices = async (): Promise<MarketPricePoint[]> => {
  try {
    // 1. Try Backend API first
    const endpoints = [
      '/api/market-prices',
      'http://localhost:8080/api/market-prices',
      'http://localhost:5000/api/market-prices'
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            return json.data.map(formatMarketPriceItem);
          }
        }
      } catch {
        // Continue to next endpoint or Supabase
      }
    }

    // 2. Direct Supabase Query (Real APMC Data from market_prices table)
    const { data, error } = await supabase
      .from('market_prices')
      .select('*')
      .order('average_price', { ascending: false });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('No APMC market price records found in Supabase database.');
    }

    return data.map(formatMarketPriceItem);
  } catch (err: any) {
    console.error('Failed to fetch APMC market prices:', err);
    throw err;
  }
};

// --- DYNAMIC SMART DIRECT TRANSPORT OPTIONS API ---

export interface TransportOptionDto {
  id: string;
  vehicleName: string;
  vehicleType: string;
  capacityKg: number;
  currentLoadKg: number;
  loadingPercentage: number;
  estimatedFreight: number;
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  availabilityStatus: 'Available' | 'Busy' | 'Maintenance';
  distanceKm: number;
  estimatedTime: string;
  matchScore: number;
  isBestMatch: boolean;
  isSuitable: boolean;
  scoreBreakdown?: {
    capacityScore: number;
    freightScore: number;
    availabilityScore: number;
    routeScore: number;
  };
}

export interface TransportOptionsResult {
  options: TransportOptionDto[];
  suitableCount: number;
  totalAvailable: number;
  pickupLocation: string;
  destination: string;
  distanceKm: number;
  estimatedTime: string;
  crop: string;
  requestedQuantityKg: number;
  dataSource: 'database' | 'seed_demo';
}

export const fetchTransportOptionsApi = async (params: {
  pickupLocation: string;
  destination: string;
  crop?: string;
  quantity?: number;
  quantityKg?: number;
  unit?: string;
}): Promise<TransportOptionsResult> => {
  const endpoints = [
    '/api/transport/options',
    'http://localhost:8080/api/transport/options',
    'http://localhost:5000/api/transport/options'
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch {
      // Continue to next endpoint or fallback
    }
  }

  // Graceful client-side fallback calculation if backend is temporarily unreachable
  const qty = params.quantityKg || (params.quantity ? (params.unit === 'quintal' ? params.quantity * 100 : params.quantity) : 800);
  const dist = params.destination.toLowerCase().includes('pune') ? 210 : 165;
  
  const seedList: TransportOptionDto[] = [
    {
      id: 'veh-tata-ace-01',
      vehicleName: 'Tata Ace Gold',
      vehicleType: 'Tempo',
      capacityKg: 1000,
      currentLoadKg: qty,
      loadingPercentage: Math.min(100, Math.round((qty / 1000) * 100)),
      estimatedFreight: Math.round((300 + 14.5 * dist) / 50) * 50,
      driverName: 'Suresh More',
      driverPhone: '+919822144550',
      vehicleNumber: 'MH-15-EG-4412',
      availabilityStatus: 'Available',
      distanceKm: dist,
      estimatedTime: '4 - 5 hours',
      matchScore: qty <= 1000 ? (qty >= 750 ? 96 : 82) : 0,
      isBestMatch: qty <= 1000 && qty > 700,
      isSuitable: qty <= 1000
    },
    {
      id: 'veh-bolero-maxi-02',
      vehicleName: 'Bolero Maxi Truck',
      vehicleType: 'Mini Truck',
      capacityKg: 1500,
      currentLoadKg: qty,
      loadingPercentage: Math.min(100, Math.round((qty / 1500) * 100)),
      estimatedFreight: Math.round((400 + 18.0 * dist) / 50) * 50,
      driverName: 'Balasaheb Shinde',
      driverPhone: '+919822144551',
      vehicleNumber: 'MH-15-BT-8901',
      availabilityStatus: 'Available',
      distanceKm: dist,
      estimatedTime: '4 - 5 hours',
      matchScore: qty <= 1500 ? (qty > 1000 ? 95 : 78) : 0,
      isBestMatch: qty > 1000 && qty <= 1500,
      isSuitable: qty <= 1500
    },
    {
      id: 'veh-mahindra-jeeto-03',
      vehicleName: 'Mahindra Jeeto',
      vehicleType: 'Mini Truck',
      capacityKg: 700,
      currentLoadKg: qty,
      loadingPercentage: Math.min(100, Math.round((qty / 700) * 100)),
      estimatedFreight: Math.round((250 + 12.5 * dist) / 50) * 50,
      driverName: 'Rahul Patil',
      driverPhone: '+919822144552',
      vehicleNumber: 'MH-15-KQ-6274',
      availabilityStatus: 'Available',
      distanceKm: dist,
      estimatedTime: '4 - 5 hours',
      matchScore: qty <= 700 ? 98 : 0,
      isBestMatch: qty <= 700,
      isSuitable: qty <= 700
    },
    {
      id: 'veh-tata-407-04',
      vehicleName: 'Tata 407',
      vehicleType: 'Light Commercial Truck',
      capacityKg: 2500,
      currentLoadKg: qty,
      loadingPercentage: Math.min(100, Math.round((qty / 2500) * 100)),
      estimatedFreight: Math.round((600 + 22.0 * dist) / 50) * 50,
      driverName: 'Amit Jadhav',
      driverPhone: '+919822144553',
      vehicleNumber: 'MH-15-CR-3158',
      availabilityStatus: 'Available',
      distanceKm: dist,
      estimatedTime: '4 - 5 hours',
      matchScore: qty <= 2500 ? (qty > 1500 ? 94 : 65) : 0,
      isBestMatch: qty > 1500 && qty <= 2500,
      isSuitable: qty <= 2500
    },
    {
      id: 'veh-ashok-leyland-05',
      vehicleName: 'Ashok Leyland Dost',
      vehicleType: 'Light Commercial Vehicle',
      capacityKg: 1500,
      currentLoadKg: qty,
      loadingPercentage: Math.min(100, Math.round((qty / 1500) * 100)),
      estimatedFreight: Math.round((400 + 18.0 * dist) / 50) * 50,
      driverName: 'Nitin Pawar',
      driverPhone: '+919822144554',
      vehicleNumber: 'MH-15-HL-7286',
      availabilityStatus: 'Busy',
      distanceKm: dist,
      estimatedTime: '4 - 5 hours',
      matchScore: 0,
      isBestMatch: false,
      isSuitable: qty <= 1500
    }
  ];

  return {
    options: seedList,
    suitableCount: seedList.filter(s => s.isSuitable && s.availabilityStatus === 'Available').length,
    totalAvailable: seedList.filter(s => s.availabilityStatus === 'Available').length,
    pickupLocation: params.pickupLocation,
    destination: params.destination,
    distanceKm: dist,
    estimatedTime: '4 - 5 hours',
    crop: params.crop || 'Produce',
    requestedQuantityKg: qty,
    dataSource: 'seed_demo'
  };
};

