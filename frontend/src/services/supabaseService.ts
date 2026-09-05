import { supabase } from '../lib/supabaseClient';
import { ProduceListing, BuyerRequirement, PurchaseRequest, OrderItem } from '../types';
import { MOCK_PRODUCE, MOCK_REQUIREMENTS, MOCK_REQUESTS, MOCK_ORDERS } from '../data/mockData';

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
      farmerName: item.farmer_name,
      farmName: item.farm_name,
      isFarmerVerified: item.is_farmer_verified ?? true,
      crop: item.crop,
      variety: item.variety,
      category: item.category,
      quantity: Number(item.quantity),
      unit: item.unit || 'quintal',
      expectedPrice: Number(item.expected_price),
      marketReferencePrice: Number(item.market_reference_price),
      location: item.location,
      quality: item.quality,
      harvestDate: item.harvest_date,
      deliveryOption: item.delivery_option,
      status: item.status,
      description: item.description,
      imageUrl: item.image_url,
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
    const payload = {
      farmer_name: produce.farmerName,
      farm_name: produce.farmName,
      is_farmer_verified: produce.isFarmerVerified,
      crop: produce.crop,
      variety: produce.variety,
      category: produce.category,
      quantity: produce.quantity,
      unit: produce.unit,
      expected_price: produce.expectedPrice,
      market_reference_price: produce.marketReferencePrice,
      location: produce.location,
      quality: produce.quality,
      harvest_date: produce.harvestDate || new Date().toISOString().split('T')[0],
      delivery_option: produce.deliveryOption,
      status: produce.status,
      description: produce.description,
      image_url: produce.imageUrl,
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
      farmerId: data.farmer_id || produce.farmerId,
      farmerName: data.farmer_name,
      farmName: data.farm_name,
      isFarmerVerified: data.is_farmer_verified,
      crop: data.crop,
      variety: data.variety,
      category: data.category,
      quantity: Number(data.quantity),
      unit: data.unit,
      expectedPrice: Number(data.expected_price),
      marketReferencePrice: Number(data.market_reference_price),
      location: data.location,
      quality: data.quality,
      harvestDate: data.harvest_date,
      deliveryOption: data.delivery_option,
      status: data.status,
      description: data.description,
      imageUrl: data.image_url,
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
      trackingSteps: item.tracking_steps || [],
    }));
  } catch (err) {
    console.error('Fetch orders error:', err);
    return MOCK_ORDERS;
  }
};

export const createOrder = async (order: Omit<OrderItem, 'id'>): Promise<OrderItem | null> => {
  try {
    const payload = {
      order_number: order.orderNumber,
      crop: order.crop,
      variety: order.variety,
      quantity: order.quantity,
      unit: order.unit,
      price_per_unit: order.pricePerUnit,
      total_amount: order.totalAmount,
      farmer_name: order.farmerName,
      farmer_farm: order.farmerFarm,
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
