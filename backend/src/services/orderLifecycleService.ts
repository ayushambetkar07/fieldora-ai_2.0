import { supabase } from '../config/supabase.js';
import { toKg } from '../utils/unitConversion.js';
import {
  OrderStatus,
  PaymentStatus,
  OrderRecord,
  OrderDispatchInput,
  OrderDispatchRecord,
  GpsTelemetryInput,
  GpsTelemetryRecord,
  QualityAssayInput,
  QualityAssayRecord,
  WeighmentInput,
  WeighmentRecord,
  OrderTransactionRecord,
  OrderInvoiceSummary
} from '../types/orderLifecycle.js';

// In-memory fallback stores for auxiliary lifecycle data if tables are pending migration
const memoryDispatches: Map<string, OrderDispatchRecord[]> = new Map();
const memoryTelemetry: Map<string, GpsTelemetryRecord[]> = new Map();
const memoryAssays: Map<string, QualityAssayRecord[]> = new Map();
const memoryWeighments: Map<string, WeighmentRecord[]> = new Map();
const memoryTransactions: Map<string, OrderTransactionRecord[]> = new Map();

// =========================================================================
// 1. IDEMPOTENT ORDER CREATION FROM ACCEPTED DEAL
// =========================================================================
export interface CreateOrderFromDealInput {
  request_id: string;
  produce_id?: string | null;
  crop: string;
  variety?: string | null;
  quantity: number;
  unit: string;
  price_per_unit: number;
  total_amount: number;
  farmer_id?: string | null;
  farmer_name?: string | null;
  farmer_farm?: string | null;
  buyer_id?: string | null;
  buyer_name?: string | null;
  buyer_company?: string | null;
  delivery_location?: string | null;
}

export async function createOrderFromDeal(input: CreateOrderFromDealInput): Promise<OrderRecord> {
  const { request_id } = input;

  // 1. Idempotency Check: check if order already exists for this purchase request
  if (request_id) {
    const { data: existingOrder, error: checkError } = await supabase
      .from('orders')
      .select('*')
      .eq('request_id', request_id)
      .maybeSingle();

    if (existingOrder && !checkError) {
      return existingOrder as OrderRecord;
    }
  }

  // 2. Generate unique order number
  const orderNumber = `FLD-${Date.now().toString().slice(-6)}`;
  const orderDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const expectedDeliveryDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const initialTrackingSteps = [
    { title: 'Deal Agreed', description: 'Purchase request terms accepted by both parties.', date: orderDate, completed: true, current: false },
    { title: 'Buyer Escrow Deposit', description: 'Buyer deposits contract funds into secure smart escrow.', date: orderDate, completed: false, current: true },
    { title: 'Logistics & Dispatch', description: 'Assigned transport vehicle en route to farm pickup.', completed: false, current: false },
    { title: 'Destination Quality & Weighment', description: 'Destination NABL assay & weighbridge verification.', completed: false, current: false },
    { title: 'Smart Escrow Released', description: 'Funds released to farmer upon dual assay/weight sign-off.', completed: false, current: false }
  ];

  const orderPayload: any = {
    order_number: orderNumber,
    request_id: input.request_id || null,
    produce_id: input.produce_id || null,
    crop: input.crop,
    variety: input.variety || 'Verified Quality Lot',
    quantity: input.quantity,
    unit: input.unit || 'kg',
    price_per_unit: input.price_per_unit,
    total_amount: input.total_amount,
    farmer_id: input.farmer_id || null,
    farmer_name: input.farmer_name || 'Verified Producer',
    farmer_farm: input.farmer_farm || 'Producer Farm Cluster',
    buyer_id: input.buyer_id || null,
    buyer_name: input.buyer_name || 'Enterprise Buyer',
    buyer_company: input.buyer_company || 'Fieldora Verified Procurement',
    delivery_location: input.delivery_location || 'Regional Delivery Hub',
    order_date: orderDate,
    expected_delivery_date: expectedDeliveryDate,
    status: 'Confirmed' as OrderStatus,
    payment_status: 'Pending' as PaymentStatus,
    tracking_steps: initialTrackingSteps
  };

  let { data: newOrder, error: insertError } = await supabase
    .from('orders')
    .insert([orderPayload])
    .select()
    .single();

  if (insertError) {
    if (insertError.code === '23505' && request_id) {
      const { data: concurrentOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('request_id', request_id)
        .single();
      if (concurrentOrder) return concurrentOrder as OrderRecord;
    }
    throw { status: 500, message: `Failed to create order: ${insertError.message}` };
  }

  return newOrder as OrderRecord;
}

// =========================================================================
// 2. LOCK BUYER ESCROW DEPOSIT (SERVER-SIDE STATE MACHINE)
// =========================================================================
export interface LockEscrowInput {
  order_id: string;
  buyer_id?: string;
  deposit_amount?: number;
  idempotency_key?: string;
  notes?: string;
}

export async function lockEscrowDeposit(input: LockEscrowInput): Promise<{ order: OrderRecord; transaction: OrderTransactionRecord }> {
  const { order_id } = input;

  // 1. Fetch order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', order_id)
    .single();

  if (orderError || !order) {
    throw { status: 404, message: 'Order not found' };
  }

  // 2. State Machine Validation
  if (order.status === 'Cancelled') {
    throw { status: 400, message: 'Cannot lock escrow on a cancelled order' };
  }

  const depositAmount = input.deposit_amount !== undefined ? Number(input.deposit_amount) : Number(order.total_amount);
  const idempotencyKey = input.idempotency_key || `escrow-lock-${order_id}-${Date.now()}`;
  const txRef = `TX-DEP-${Date.now().toString().slice(-8)}`;

  // 3. Update Order Payment Status
  const updatedTrackingSteps = (order.tracking_steps || []).map((step: any, idx: number) => {
    if (idx === 1) return { ...step, completed: true, current: false, date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) };
    if (idx === 2) return { ...step, completed: false, current: true };
    return step;
  });

  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update({
      payment_status: 'Escrow Locked',
      tracking_steps: updatedTrackingSteps
    })
    .eq('id', order_id)
    .select()
    .single();

  if (updateError || !updatedOrder) {
    throw { status: 500, message: `Failed to lock escrow: ${updateError?.message}` };
  }

  // 4. Record Append-Only Financial Transaction
  const transactionPayload: OrderTransactionRecord = {
    id: `tx-${Date.now()}`,
    transaction_reference: txRef,
    order_id: order_id,
    sender_id: order.buyer_id || null,
    sender_role: 'buyer',
    recipient_id: null,
    recipient_role: 'escrow_vault',
    transaction_type: 'escrow_deposit',
    amount: depositAmount,
    currency: 'INR',
    status: 'settled',
    idempotency_key: idempotencyKey,
    notes: input.notes || `Escrow deposit locked for Order #${order.order_number}`,
    created_at: new Date().toISOString()
  };

  const { data: txRecord, error: txError } = await supabase
    .from('order_transactions')
    .insert([transactionPayload])
    .select()
    .single();

  let finalTx = txRecord as OrderTransactionRecord;
  if (txError || !finalTx) {
    const list = memoryTransactions.get(order_id) || [];
    list.push(transactionPayload);
    memoryTransactions.set(order_id, list);
    finalTx = transactionPayload;
  }

  return {
    order: updatedOrder as OrderRecord,
    transaction: finalTx
  };
}

// =========================================================================
// 3. DISPATCH LOGISTICS (FLEET & DRIVER ASSIGNMENT)
// =========================================================================
export async function dispatchOrderLogistics(order_id: string, dispatchInput: OrderDispatchInput): Promise<{ order: OrderRecord; dispatch: OrderDispatchRecord }> {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', order_id)
    .single();

  if (orderError || !order) {
    throw { status: 404, message: 'Order not found' };
  }

  if (order.payment_status !== 'Escrow Locked') {
    throw { status: 400, message: `Cannot dispatch shipment: Escrow deposit is '${order.payment_status}'. Escrow must be locked before farm-gate dispatch.` };
  }

  if (order.status === 'Cancelled' || order.status === 'Completed') {
    throw { status: 400, message: `Cannot dispatch order in terminal state: ${order.status}` };
  }

  const dispatchPayload: OrderDispatchRecord = {
    id: `disp-${Date.now()}`,
    order_id,
    vehicle_id: dispatchInput.vehicle_id || 'veh-default',
    vehicle_name: dispatchInput.vehicle_name,
    vehicle_type: dispatchInput.vehicle_type,
    vehicle_number: dispatchInput.vehicle_number,
    driver_name: dispatchInput.driver_name,
    driver_phone: dispatchInput.driver_phone,
    pickup_location: dispatchInput.pickup_location || order.delivery_location || 'Origin Farm',
    delivery_location: dispatchInput.delivery_location || order.delivery_location || 'Destination Mandi Hub',
    pickup_node_id: dispatchInput.pickup_node_id || undefined,
    delivery_node_id: dispatchInput.delivery_node_id || undefined,
    route_id: dispatchInput.route_id || undefined,
    estimated_distance_km: dispatchInput.estimated_distance_km || 0,
    estimated_duration_minutes: dispatchInput.estimated_duration_minutes || 0,
    estimated_toll_cost: dispatchInput.estimated_toll_cost || 0,
    dispatched_at: new Date().toISOString(),
    status: 'In Transit',
    created_at: new Date().toISOString()
  };

  const { data: dispatchRecord, error: dispatchError } = await supabase
    .from('order_dispatches')
    .insert([dispatchPayload])
    .select()
    .single();

  let finalDispatch = dispatchRecord as OrderDispatchRecord;
  if (dispatchError || !finalDispatch) {
    const list = memoryDispatches.get(order_id) || [];
    list.push(dispatchPayload);
    memoryDispatches.set(order_id, list);
    finalDispatch = dispatchPayload;
  }

  // Update Order Status to In Transit
  const updatedTrackingSteps = (order.tracking_steps || []).map((step: any, idx: number) => {
    if (idx <= 1) return { ...step, completed: true, current: false };
    if (idx === 2) return { ...step, completed: true, current: false, date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) };
    if (idx === 3) return { ...step, completed: false, current: true };
    return step;
  });

  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'In Transit',
      tracking_steps: updatedTrackingSteps
    })
    .eq('id', order_id)
    .select()
    .single();

  if (updateError || !updatedOrder) {
    throw { status: 500, message: `Failed to update order status: ${updateError?.message}` };
  }

  return {
    order: updatedOrder as OrderRecord,
    dispatch: finalDispatch
  };
}

// =========================================================================
// 4. RECORD GPS TELEMETRY
// =========================================================================
export async function recordGpsTelemetry(order_id: string, telemetry: GpsTelemetryInput): Promise<GpsTelemetryRecord> {
  if (telemetry.latitude === undefined || isNaN(telemetry.latitude) || telemetry.longitude === undefined || isNaN(telemetry.longitude)) {
    throw { status: 400, message: 'Valid latitude and longitude are required' };
  }

  const payload: GpsTelemetryRecord = {
    id: `gps-${Date.now()}`,
    order_id,
    dispatch_id: telemetry.dispatch_id || undefined,
    latitude: telemetry.latitude,
    longitude: telemetry.longitude,
    speed_kmh: telemetry.speed_kmh || 0,
    heading: telemetry.heading || undefined,
    checkpoint_name: telemetry.checkpoint_name || undefined,
    progress_percent: Math.min(100, Math.max(0, telemetry.progress_percent || 0)),
    eta: telemetry.eta || undefined,
    recorded_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('order_gps_telemetry')
    .insert([payload])
    .select()
    .single();

  if (error || !data) {
    const list = memoryTelemetry.get(order_id) || [];
    list.push(payload);
    memoryTelemetry.set(order_id, list);
    return payload;
  }

  return data as GpsTelemetryRecord;
}

export async function getLatestGpsTelemetry(order_id: string): Promise<GpsTelemetryRecord | null> {
  const { data, error } = await supabase
    .from('order_gps_telemetry')
    .select('*')
    .eq('order_id', order_id)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    const list = memoryTelemetry.get(order_id) || [];
    return list[list.length - 1] || null;
  }
  return data as GpsTelemetryRecord;
}

// =========================================================================
// 5. MARK ORDER DELIVERED AT DESTINATION
// =========================================================================
export async function markOrderDelivered(order_id: string): Promise<OrderRecord> {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', order_id)
    .single();

  if (orderError || !order) {
    throw { status: 404, message: 'Order not found' };
  }

  if (order.status === 'Completed' || order.status === 'Cancelled') {
    throw { status: 400, message: `Order already in terminal status: ${order.status}` };
  }

  const updatedTrackingSteps = (order.tracking_steps || []).map((step: any, idx: number) => {
    if (idx <= 2) return { ...step, completed: true, current: false };
    if (idx === 3) return { ...step, completed: false, current: true, date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) };
    return step;
  });

  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'Delivered',
      tracking_steps: updatedTrackingSteps
    })
    .eq('id', order_id)
    .select()
    .single();

  if (updateError || !updatedOrder) {
    throw { status: 500, message: `Failed to mark order delivered: ${updateError?.message}` };
  }

  return updatedOrder as OrderRecord;
}

// =========================================================================
// 6. RECORD DESTINATION QUALITY ASSAY (GATEKEEPER 1)
// =========================================================================
export async function recordQualityAssay(order_id: string, assayInput: QualityAssayInput): Promise<QualityAssayRecord> {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', order_id)
    .single();

  if (orderError || !order) {
    throw { status: 404, message: 'Order not found' };
  }

  if (!assayInput.inspector_name || !assayInput.lab_name || !assayInput.tested_grade) {
    throw { status: 400, message: 'inspector_name, lab_name, and tested_grade are required' };
  }

  const payload: QualityAssayRecord = {
    id: `assay-${Date.now()}`,
    order_id,
    inspector_id: assayInput.inspector_id || undefined,
    inspector_name: assayInput.inspector_name,
    lab_name: assayInput.lab_name,
    tested_grade: assayInput.tested_grade,
    target_grade: assayInput.target_grade || 'Grade A',
    moisture_percentage: assayInput.moisture_percentage || undefined,
    foreign_matter_percentage: assayInput.foreign_matter_percentage || undefined,
    certificate_number: assayInput.certificate_number || undefined,
    certificate_url: assayInput.certificate_url || undefined,
    assay_passed: Boolean(assayInput.assay_passed),
    notes: assayInput.notes || undefined,
    verified_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('order_quality_assays')
    .insert([payload])
    .select()
    .single();

  if (error || !data) {
    const list = memoryAssays.get(order_id) || [];
    list.push(payload);
    memoryAssays.set(order_id, list);
    return payload;
  }

  return data as QualityAssayRecord;
}

// =========================================================================
// 7. RECORD DESTINATION WEIGHMENT VERIFICATION (GATEKEEPER 2)
// =========================================================================
export async function recordOrderWeighment(order_id: string, weighmentInput: WeighmentInput): Promise<WeighmentRecord> {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', order_id)
    .single();

  if (orderError || !order) {
    throw { status: 404, message: 'Order not found' };
  }

  if (!weighmentInput.weighbridge_name || !weighmentInput.weighbridge_slip_id) {
    throw { status: 400, message: 'weighbridge_name and weighbridge_slip_id are required' };
  }

  const grossWeight = Number(weighmentInput.gross_weight);
  const tareWeight = Number(weighmentInput.tare_weight);
  if (isNaN(grossWeight) || isNaN(tareWeight) || grossWeight < 0 || tareWeight < 0 || grossWeight < tareWeight) {
    throw { status: 400, message: 'Valid gross_weight and tare_weight (gross >= tare >= 0) are required' };
  }

  const netWeight = Math.round((grossWeight - tareWeight) * 100) / 100;
  const weighmentUnit = weighmentInput.unit || 'kg';
  const netWeightKg = toKg(netWeight, weighmentUnit);
  const contractedQty = Number(order.quantity);
  const contractedWeightKg = toKg(contractedQty, order.unit || 'kg');

  const varianceWeight = Math.round((netWeightKg - contractedWeightKg) * 100) / 100;
  const variancePercentage = contractedWeightKg > 0 ? Math.round((varianceWeight / contractedWeightKg) * 10000) / 100 : 0;
  const weightVerified = variancePercentage >= -5.0 && variancePercentage <= 10.0;

  const payload: WeighmentRecord = {
    id: `wb-${Date.now()}`,
    order_id,
    weighbridge_name: weighmentInput.weighbridge_name,
    weighbridge_slip_id: weighmentInput.weighbridge_slip_id,
    operator_name: weighmentInput.operator_name || undefined,
    contracted_weight: contractedQty,
    gross_weight: grossWeight,
    tare_weight: tareWeight,
    net_weight: netWeight,
    unit: weighmentUnit,
    variance_weight: varianceWeight,
    variance_percentage: variancePercentage,
    weight_verified: weightVerified,
    notes: weighmentInput.notes || undefined,
    verified_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('order_weighments')
    .insert([payload])
    .select()
    .single();

  if (error || !data) {
    const list = memoryWeighments.get(order_id) || [];
    list.push(payload);
    memoryWeighments.set(order_id, list);
    return payload;
  }

  return data as WeighmentRecord;
}

// =========================================================================
// 8. CONDITIONAL SMART PAYOUT RELEASE (DUAL-GATEKEEPER & IDEMPOTENT)
// =========================================================================
export interface ReleaseSmartPayoutInput {
  order_id: string;
  user_id?: string;
  idempotency_key?: string;
  notes?: string;
}

export async function releaseSmartPayout(input: ReleaseSmartPayoutInput): Promise<{ order: OrderRecord; transaction: OrderTransactionRecord }> {
  const { order_id } = input;

  // 1. Fetch Order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', order_id)
    .single();

  if (orderError || !order) {
    throw { status: 404, message: 'Order not found' };
  }

  // 2. Pre-condition Checks
  if (order.payment_status === 'Released') {
    const memList = memoryTransactions.get(order_id) || [];
    const memPayout = memList.find(t => t.transaction_type === 'farmer_payout');
    if (memPayout) return { order: order as OrderRecord, transaction: memPayout };

    const { data: existingPayoutTx } = await supabase
      .from('order_transactions')
      .select('*')
      .eq('order_id', order_id)
      .eq('transaction_type', 'farmer_payout')
      .maybeSingle();

    if (existingPayoutTx) {
      return { order: order as OrderRecord, transaction: existingPayoutTx as OrderTransactionRecord };
    }
  }

  if (order.payment_status !== 'Escrow Locked') {
    throw { status: 400, message: `Cannot release payout: Escrow status is '${order.payment_status}'. Must be 'Escrow Locked'.` };
  }

  if (order.status !== 'Delivered' && order.status !== 'In Transit') {
    throw { status: 400, message: `Cannot release payout: Order status is '${order.status}'. Order must be delivered at destination.` };
  }

  // 3. DUAL-GATE VALIDATION: Gatekeeper 1 -> Quality Assay
  let qualityAssay: QualityAssayRecord | null = null;
  const { data: dbAssay } = await supabase
    .from('order_quality_assays')
    .select('*')
    .eq('order_id', order_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  qualityAssay = dbAssay as QualityAssayRecord;
  if (!qualityAssay) {
    const list = memoryAssays.get(order_id) || [];
    qualityAssay = list[list.length - 1] || null;
  }

  if (!qualityAssay) {
    throw { status: 400, message: 'Payout rejected: Destination quality assay report is missing. NABL quality assay is required before fund release.' };
  }

  if (!qualityAssay.assay_passed) {
    throw { status: 400, message: `Payout rejected: Quality assay failed (${qualityAssay.tested_grade} does not meet required standard). Escrow remains locked pending dispute resolution.` };
  }

  // 4. DUAL-GATE VALIDATION: Gatekeeper 2 -> Weighment Verification
  let weighment: WeighmentRecord | null = null;
  const { data: dbWeighment } = await supabase
    .from('order_weighments')
    .select('*')
    .eq('order_id', order_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  weighment = dbWeighment as WeighmentRecord;
  if (!weighment) {
    const list = memoryWeighments.get(order_id) || [];
    weighment = list[list.length - 1] || null;
  }

  if (!weighment) {
    throw { status: 400, message: 'Payout rejected: Weighbridge weighment receipt is missing. Weighment verification is required before fund release.' };
  }

  if (!weighment.weight_verified) {
    throw { status: 400, message: `Payout rejected: Weighment variance of ${weighment.variance_percentage}% exceeds allowed tolerance. Verification sign-off required.` };
  }

  // 5. Calculate Final Payout Amount
  const contractedQty = Number(order.quantity);
  const pricePerUnit = Number(order.price_per_unit);
  const contractedWeightKg = toKg(contractedQty, order.unit || 'kg');
  const deliveredNetWeightKg = toKg(Number(weighment.net_weight), weighment.unit || 'kg');
  const pricePerKg = contractedWeightKg > 0 ? (Number(order.total_amount) / contractedWeightKg) : pricePerUnit;
  
  const verifiedTotal = Math.round(deliveredNetWeightKg * pricePerKg * 100) / 100;
  const payoutAmount = Math.min(Number(order.total_amount), verifiedTotal > 0 ? verifiedTotal : Number(order.total_amount));

  const idempotencyKey = input.idempotency_key || `payout-${order_id}-${Date.now()}`;
  const txRef = `TX-PAY-${Date.now().toString().slice(-8)}`;

  // 6. ATOMIC STATUS TRANSITION
  const updatedTrackingSteps = (order.tracking_steps || []).map((step: any, idx: number) => {
    if (idx <= 3) return { ...step, completed: true, current: false };
    if (idx === 4) return { ...step, completed: true, current: false, date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) };
    return step;
  });

  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'Completed',
      payment_status: 'Released',
      tracking_steps: updatedTrackingSteps
    })
    .eq('id', order_id)
    .eq('payment_status', 'Escrow Locked')
    .select()
    .single();

  if (updateError || !updatedOrder) {
    throw { status: 409, message: 'Concurrent payout release detected or escrow state already transitioned' };
  }

  // 7. Record Immutable Financial Transaction in Ledger
  const transactionPayload: OrderTransactionRecord = {
    id: `tx-pay-${Date.now()}`,
    transaction_reference: txRef,
    order_id: order_id,
    sender_id: null,
    sender_role: 'escrow_vault',
    recipient_id: order.farmer_id || null,
    recipient_role: 'farmer',
    transaction_type: 'farmer_payout',
    amount: payoutAmount,
    currency: 'INR',
    status: 'settled',
    idempotency_key: idempotencyKey,
    notes: input.notes || `Smart payout released for Order #${order.order_number} upon dual assay & weighment verification`,
    metadata: {
      contracted_quantity: contractedQty,
      delivered_quantity: Number(weighment.net_weight),
      price_per_unit: pricePerUnit,
      assay_certificate: qualityAssay.certificate_number || 'NABL-VERIFIED',
      weighbridge_slip: weighment.weighbridge_slip_id
    },
    created_at: new Date().toISOString()
  };

  const { data: txRecord, error: txError } = await supabase
    .from('order_transactions')
    .insert([transactionPayload])
    .select()
    .single();

  let finalTx = txRecord as OrderTransactionRecord;
  if (txError || !finalTx) {
    const list = memoryTransactions.get(order_id) || [];
    list.push(transactionPayload);
    memoryTransactions.set(order_id, list);
    finalTx = transactionPayload;
  }

  return {
    order: updatedOrder as OrderRecord,
    transaction: finalTx
  };
}

// =========================================================================
// 9. DIGITAL INVOICE / RECEIPT GENERATOR
// =========================================================================
export async function generateOrderInvoice(order_id: string): Promise<OrderInvoiceSummary> {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', order_id)
    .single();

  if (orderError || !order) {
    throw { status: 404, message: 'Order not found' };
  }

  const [dispatchRes, assayRes, weighmentRes, txRes] = await Promise.all([
    supabase.from('order_dispatches').select('*').eq('order_id', order_id).maybeSingle(),
    supabase.from('order_quality_assays').select('*').eq('order_id', order_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('order_weighments').select('*').eq('order_id', order_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('order_transactions').select('*').eq('order_id', order_id).order('created_at', { ascending: true })
  ]);

  const dispatch = dispatchRes.data || (memoryDispatches.get(order_id)?.[0]);
  const assay = assayRes.data || (memoryAssays.get(order_id)?.[memoryAssays.get(order_id)?.length! - 1]);
  const weighment = weighmentRes.data || (memoryWeighments.get(order_id)?.[memoryWeighments.get(order_id)?.length! - 1]);
  const transactions: OrderTransactionRecord[] = txRes.data || (memoryTransactions.get(order_id) || []);

  const invoiceNum = `INV-${order.order_number.replace('FLD-', '')}-${new Date().getFullYear()}`;
  const invoiceDate = order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today';

  const contractedQty = Number(order.quantity);
  const pricePerUnit = Number(order.price_per_unit);
  const grossContractAmount = Number(order.total_amount);
  const deliveredNetWeight = weighment ? Number(weighment.net_weight) : undefined;
  const verifiedDeliveryAmount = deliveredNetWeight ? Math.round(deliveredNetWeight * pricePerUnit * 100) / 100 : grossContractAmount;
  const logisticsCost = dispatch ? Number(dispatch.estimated_toll_cost || 0) : 0;

  const payoutTx = transactions.find(t => t.transaction_type === 'farmer_payout');
  const netFarmerPayout = payoutTx ? Number(payoutTx.amount) : (order.payment_status === 'Released' ? verifiedDeliveryAmount : 0);

  return {
    order_id: order.id,
    order_number: order.order_number,
    invoice_number: invoiceNum,
    invoice_date: invoiceDate,
    buyer: {
      name: order.buyer_name || 'Enterprise Buyer',
      company: order.buyer_company || 'Fieldora Procurement Member',
      location: order.delivery_location || 'Regional Delivery Hub'
    },
    farmer: {
      name: order.farmer_name || 'Verified Farmer',
      farm: order.farmer_farm || 'Producer Cluster',
      location: order.delivery_location || 'Farm Origin'
    },
    commodity: {
      crop: order.crop,
      variety: order.variety || 'Standard Lot',
      contracted_quantity: contractedQty,
      delivered_net_weight: deliveredNetWeight,
      unit: order.unit,
      price_per_unit: pricePerUnit
    },
    financial_breakdown: {
      gross_contract_amount: grossContractAmount,
      verified_delivery_amount: verifiedDeliveryAmount,
      logistics_cost: logisticsCost,
      escrow_deposit_paid: grossContractAmount,
      net_farmer_payout: netFarmerPayout,
      escrow_status: order.payment_status
    },
    verification_summary: {
      quality_assay_passed: Boolean(assay?.assay_passed),
      quality_grade_certified: assay?.tested_grade,
      weighment_verified: Boolean(weighment?.weight_verified),
      weighment_slip_id: weighment?.weighbridge_slip_id
    },
    settlement_status: order.status === 'Completed' && order.payment_status === 'Released' ? 'Fully Settled & Completed' : 'In Escrow / Transit',
    transaction_references: transactions.map(t => t.transaction_reference)
  };
}

// =========================================================================
// 10. GET COMPLETE ORDER AUDIT TRAIL
// =========================================================================
export async function getOrderAuditTrail(order_id: string) {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', order_id)
    .single();

  if (orderError || !order) {
    throw { status: 404, message: 'Order not found' };
  }

  const [dispatches, telemetry, assays, weighments, transactions] = await Promise.all([
    supabase.from('order_dispatches').select('*').eq('order_id', order_id).order('created_at', { ascending: true }),
    supabase.from('order_gps_telemetry').select('*').eq('order_id', order_id).order('recorded_at', { ascending: true }),
    supabase.from('order_quality_assays').select('*').eq('order_id', order_id).order('created_at', { ascending: true }),
    supabase.from('order_weighments').select('*').eq('order_id', order_id).order('created_at', { ascending: true }),
    supabase.from('order_transactions').select('*').eq('order_id', order_id).order('created_at', { ascending: true })
  ]);

  return {
    order,
    dispatches: dispatches.data?.length ? dispatches.data : (memoryDispatches.get(order_id) || []),
    gps_telemetry: telemetry.data?.length ? telemetry.data : (memoryTelemetry.get(order_id) || []),
    quality_assays: assays.data?.length ? assays.data : (memoryAssays.get(order_id) || []),
    weighments: weighments.data?.length ? weighments.data : (memoryWeighments.get(order_id) || []),
    transactions: transactions.data?.length ? transactions.data : (memoryTransactions.get(order_id) || [])
  };
}
