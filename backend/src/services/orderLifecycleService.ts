import { supabase } from '../config/supabase.js';
import { toKg, UNIT_TO_KG_MAP } from '../utils/unitConversion.js';
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
// 1.5. CONFIRM FARMER TRANSPORT (FARMER ACTION)
// =========================================================================
export interface ConfirmTransportInput {
  order_id: string;
  user_id?: string;
  user_role?: string;
  confirmed_by?: string;
  notes?: string;
}

export async function confirmFarmerTransport(
  inputOrId: ConfirmTransportInput | string,
  options?: Partial<ConfirmTransportInput>
): Promise<OrderRecord> {
  const input: ConfirmTransportInput =
    typeof inputOrId === 'string'
      ? { order_id: inputOrId, ...options }
      : inputOrId;
  const { order_id, user_role, user_id, confirmed_by } = input;

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', order_id)
    .single();

  if (orderError || !order) {
    throw { status: 404, message: 'Order not found' };
  }

  // 1. Role validation: Farmer only
  if (user_role && user_role.toLowerCase() !== 'farmer' && user_role.toLowerCase() !== 'seller') {
    throw { status: 403, message: 'Unauthorized: Only the farmer/seller can confirm transport readiness for this order.' };
  }

  // 2. State Validation: Order must be 'Confirmed'
  if (order.status !== 'Confirmed') {
    if (order.status === 'Transport Confirmed' || order.transport_confirmed) {
      return order as OrderRecord; // Idempotent return
    }
    throw { status: 400, message: `Cannot confirm transport. Order is already in status '${order.status}'.` };
  }

  const updatedTrackingSteps = (order.tracking_steps || []).map((step: any, idx: number) => {
    if (idx === 0) return { ...step, completed: true, current: false };
    if (idx === 1) return { ...step, completed: false, current: true, description: 'Farmer confirmed transport. Ready for Buyer escrow deposit.' };
    return step;
  });

  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'Transport Confirmed',
      transport_confirmed: true,
      transport_confirmed_at: new Date().toISOString(),
      transport_confirmed_by: confirmed_by || order.farmer_name || 'Farmer',
      tracking_steps: updatedTrackingSteps
    })
    .eq('id', order_id)
    .select()
    .single();

  if (updateError || !updatedOrder) {
    throw { status: 500, message: `Failed to confirm transport: ${updateError?.message}` };
  }

  return updatedOrder as OrderRecord;
}

// =========================================================================
// 2. LOCK BUYER ESCROW DEPOSIT (BUYER ACTION)
// =========================================================================
export interface LockEscrowInput {
  order_id: string;
  user_id?: string;
  user_role?: string;
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

  // Role validation: Buyer only
  if (input.user_role && input.user_role.toLowerCase() !== 'buyer') {
    throw { status: 403, message: 'Unauthorized: Only the buyer can lock escrow funds for this order.' };
  }

  // 2. State Machine Validation
  if (order.status === 'Cancelled') {
    throw { status: 400, message: 'Cannot lock escrow on a cancelled order' };
  }

  // CRITICAL RULE: Farmer must have confirmed transport first before Buyer can lock escrow!
  const isTransportConfirmed = order.status === 'Transport Confirmed' || order.transport_confirmed === true;
  if (!isTransportConfirmed && order.status === 'Confirmed') {
    throw { status: 400, message: 'Cannot lock escrow: Farmer must confirm transport readiness before Buyer can lock escrow.' };
  }

  if (order.payment_status === 'Escrow Locked') {
    return {
      order: order as OrderRecord,
      transaction: {
        id: 'tx-existing',
        order_id,
        transaction_reference: 'TX-DEP-EXISTING',
        sender_role: 'buyer',
        recipient_role: 'escrow_vault',
        transaction_type: 'escrow_deposit',
        amount: Number(order.total_amount),
        currency: 'INR',
        status: 'settled',
        idempotency_key: `escrow-lock-${order_id}-existing`,
        created_at: new Date().toISOString()
      }
    };
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
      status: 'Escrow Locked',
      payment_status: 'Escrow Locked',
      escrow_locked_at: new Date().toISOString(),
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
// 3. DISPATCH LOGISTICS (FLEET & DRIVER ASSIGNMENT - BUYER ACTION)
// =========================================================================
export interface DispatchAuthInput {
  user_id?: string;
  user_role?: string;
}

export async function dispatchOrderLogistics(order_id: string, dispatchInput: OrderDispatchInput, authInput?: DispatchAuthInput): Promise<{ order: OrderRecord; dispatch: OrderDispatchRecord }> {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', order_id)
    .single();

  if (orderError || !order) {
    throw { status: 404, message: 'Order not found' };
  }

  // Role validation: Buyer / Logistics partner only
  if (authInput?.user_role && authInput.user_role.toLowerCase() !== 'buyer' && authInput.user_role.toLowerCase() !== 'logistics') {
    throw { status: 403, message: 'Unauthorized: Only the buyer or logistics partner can dispatch transport.' };
  }

  if (order.payment_status !== 'Escrow Locked') {
    throw { status: 400, message: `Cannot dispatch shipment: Escrow deposit is '${order.payment_status}'. Escrow must be locked before farm-gate dispatch.` };
  }

  if (order.status === 'Cancelled' || order.status === 'Completed') {
    throw { status: 400, message: `Cannot dispatch order in terminal state: ${order.status}` };
  }

  // Check if an active dispatch already exists for this order to prevent duplicates
  const { data: existingDispatch } = await supabase
    .from('order_dispatches')
    .select('*')
    .eq('order_id', order_id)
    .neq('status', 'Delivered')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let finalDispatch: OrderDispatchRecord;

  if (existingDispatch) {
    const { data: updatedDispatch, error: updateDispError } = await supabase
      .from('order_dispatches')
      .update({
        vehicle_id: dispatchInput.vehicle_id || existingDispatch.vehicle_id,
        vehicle_name: dispatchInput.vehicle_name || existingDispatch.vehicle_name,
        vehicle_type: dispatchInput.vehicle_type || existingDispatch.vehicle_type,
        vehicle_number: dispatchInput.vehicle_number || existingDispatch.vehicle_number,
        driver_name: dispatchInput.driver_name || existingDispatch.driver_name,
        driver_phone: dispatchInput.driver_phone || existingDispatch.driver_phone,
        pickup_location: dispatchInput.pickup_location || existingDispatch.pickup_location,
        delivery_location: dispatchInput.delivery_location || existingDispatch.delivery_location,
        pickup_node_id: dispatchInput.pickup_node_id || existingDispatch.pickup_node_id,
        delivery_node_id: dispatchInput.delivery_node_id || existingDispatch.delivery_node_id,
        route_id: dispatchInput.route_id || existingDispatch.route_id,
        estimated_distance_km: dispatchInput.estimated_distance_km || existingDispatch.estimated_distance_km,
        estimated_duration_minutes: dispatchInput.estimated_duration_minutes || existingDispatch.estimated_duration_minutes,
        estimated_toll_cost: dispatchInput.estimated_toll_cost || existingDispatch.estimated_toll_cost,
        status: 'In Transit'
      })
      .eq('id', existingDispatch.id)
      .select()
      .single();

    if (updatedDispatch && !updateDispError) {
      finalDispatch = updatedDispatch as OrderDispatchRecord;
    } else {
      finalDispatch = {
        ...existingDispatch,
        ...dispatchInput,
        status: 'In Transit'
      } as OrderDispatchRecord;
    }
  } else {
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

    if (dispatchError || !dispatchRecord) {
      const list = memoryDispatches.get(order_id) || [];
      list.push(dispatchPayload);
      memoryDispatches.set(order_id, list);
      finalDispatch = dispatchPayload;
    } else {
      finalDispatch = dispatchRecord as OrderDispatchRecord;
    }
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
// =========================================================================
// 5. MARK ORDER ARRIVED AT DESTINATION (WORKFLOW ACTION 1)
// =========================================================================
export interface MarkArrivedInput {
  arrived_by?: string;
  arrival_remarks?: string;
  user_id?: string;
  user_role?: string;
}

export async function markOrderArrived(order_id: string, input: MarkArrivedInput = {}): Promise<OrderRecord> {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', order_id)
    .single();

  if (orderError || !order) {
    throw { status: 404, message: 'Order not found' };
  }

  // Role validation: Buyer only
  if (input.user_role && input.user_role.toLowerCase() !== 'buyer' && input.user_role.toLowerCase() !== 'verifier') {
    throw { status: 403, message: 'Unauthorized: Only the buyer can mark shipment as arrived.' };
  }

  if (order.status === 'Completed' || order.status === 'Cancelled') {
    throw { status: 400, message: `Order already in terminal status: ${order.status}` };
  }

  if (order.status !== 'In Transit' && order.status !== 'in_transit') {
    if (order.status === 'Arrived' || order.status === 'Quality Verified') {
      return order as OrderRecord;
    }
    throw { status: 400, message: `Order must be In Transit before it can be marked as Arrived. Current status is '${order.status}'.` };
  }

  const arrivalDateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const arrivalIso = new Date().toISOString();

  const updatedTrackingSteps = (order.tracking_steps || []).map((step: any, idx: number) => {
    if (idx <= 2) return { ...step, completed: true, current: false };
    if (idx === 3) return { ...step, completed: true, current: false, date: arrivalDateStr };
    if (idx === 4) return { ...step, completed: false, current: true };
    return step;
  });

  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'Arrived',
      arrived_at: arrivalIso,
      arrived_by: input.arrived_by || 'Destination Hub Inspector',
      arrival_remarks: input.arrival_remarks || 'Shipment arrived at destination hub',
      tracking_steps: updatedTrackingSteps
    })
    .eq('id', order_id)
    .select()
    .single();

  if (updateError || !updatedOrder) {
    throw { status: 500, message: `Failed to mark order arrived: ${updateError?.message}` };
  }

  return updatedOrder as OrderRecord;
}

export async function markOrderDelivered(order_id: string): Promise<OrderRecord> {
  return markOrderArrived(order_id, { arrived_by: 'Logistics Courier', arrival_remarks: 'Consignment arrived at destination facility' });
}

// =========================================================================
// 5.5 VERIFY WEIGHT & QUALITY (WORKFLOW ACTION 2 - BUYER ACTION)
// =========================================================================
export interface VerifyQualityAndWeightInput {
  actual_received_quantity: number;
  actual_quantity_unit?: string;
  quality_grade: string;
  assay_result: 'Passed' | 'Failed' | 'Pending' | string;
  assay_notes?: string;
  verification_remarks?: string;
  verified_by?: string;
  user_id?: string;
  user_role?: string;
}

export async function verifyOrderQualityAndWeight(order_id: string, input: VerifyQualityAndWeightInput): Promise<{ order: OrderRecord; assay?: QualityAssayRecord; weighment?: WeighmentRecord }> {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', order_id)
    .single();

  if (orderError || !order) {
    throw { status: 404, message: 'Order not found' };
  }

  // Role validation: Buyer / Verifier only
  if (input.user_role && input.user_role.toLowerCase() !== 'buyer' && input.user_role.toLowerCase() !== 'verifier' && input.user_role.toLowerCase() !== 'inspector') {
    throw { status: 403, message: 'Unauthorized: Only the buyer or authorized inspector can verify weight and quality.' };
  }

  if (order.status === 'Completed' || order.status === 'Cancelled') {
    throw { status: 400, message: `Cannot verify order in terminal status: ${order.status}` };
  }

  if (order.status !== 'Arrived' && order.status !== 'Delivered') {
    if (order.status === 'Quality Verified') {
      throw { status: 400, message: 'Weight and quality have already been verified for this order.' };
    }
    throw { status: 400, message: `Order must be marked as Arrived before verification. Current status is '${order.status}'.` };
  }

  const actualQty = Number(input.actual_received_quantity);
  if (isNaN(actualQty) || actualQty <= 0) {
    throw { status: 400, message: 'Actual received quantity is required and must be greater than 0.' };
  }

  if (!input.quality_grade || !input.quality_grade.trim()) {
    throw { status: 400, message: 'Quality grade selection is required.' };
  }

  if (!input.assay_result || !input.assay_result.trim()) {
    throw { status: 400, message: 'Assay verification result (Passed / Failed / Pending) is required.' };
  }

  const verifiedAtIso = new Date().toISOString();
  const verifiedDateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const isPassed = input.assay_result.toLowerCase() === 'passed';
  const unit = input.actual_quantity_unit || order.unit || 'kg';

  // Save Quality Assay Record
  const assayPayload: QualityAssayRecord = {
    id: `assay-${Date.now()}`,
    order_id,
    inspector_name: input.verified_by || 'Destination Quality Inspector',
    lab_name: 'Fieldora Certified On-Site Assay Lab',
    tested_grade: input.quality_grade,
    target_grade: 'Grade A',
    assay_passed: isPassed,
    notes: input.assay_notes || input.verification_remarks || undefined,
    verified_at: verifiedAtIso,
    created_at: verifiedAtIso
  };

  const { data: assayData, error: assayError } = await supabase
    .from('order_quality_assays')
    .insert([assayPayload])
    .select()
    .single();

  let finalAssay = assayData as QualityAssayRecord;
  if (assayError || !finalAssay) {
    const list = memoryAssays.get(order_id) || [];
    list.push(assayPayload);
    memoryAssays.set(order_id, list);
    finalAssay = assayPayload;
  }

  // Save Weighment Record
  const contractedQty = Number(order.quantity);
  const contractedInKg = toKg(contractedQty, order.unit || 'kg');
  const actualInKg = toKg(actualQty, unit || order.unit || 'kg');
  const varianceWeight = Math.round((actualInKg - contractedInKg) * 100) / 100;
  const variancePercentage = contractedInKg > 0 ? Math.round((varianceWeight / contractedInKg) * 10000) / 100 : 0;

  const weighmentPayload: WeighmentRecord = {
    id: `wb-${Date.now()}`,
    order_id,
    weighbridge_name: 'Destination Automated Weighbridge',
    weighbridge_slip_id: `WB-SLIP-${Date.now().toString().slice(-6)}`,
    operator_name: input.verified_by || 'Weighbridge Operator',
    contracted_weight: contractedQty,
    gross_weight: actualQty,
    tare_weight: 0,
    net_weight: actualQty,
    unit: unit,
    variance_weight: varianceWeight,
    variance_percentage: variancePercentage,
    weight_verified: isPassed,
    notes: input.verification_remarks || undefined,
    verified_at: verifiedAtIso,
    created_at: verifiedAtIso
  };

  const { data: weighmentData, error: weighmentError } = await supabase
    .from('order_weighments')
    .insert([weighmentPayload])
    .select()
    .single();

  let finalWeighment = weighmentData as WeighmentRecord;
  if (weighmentError || !finalWeighment) {
    const list = memoryWeighments.get(order_id) || [];
    list.push(weighmentPayload);
    memoryWeighments.set(order_id, list);
    finalWeighment = weighmentPayload;
  }

  if (!isPassed) {
    // If assay failed, retain failed state and dispute
    const { data: failedOrder } = await supabase
      .from('orders')
      .update({
        status: 'Disputed',
        actual_received_quantity: actualQty,
        actual_quantity_unit: unit,
        quality_grade: input.quality_grade,
        assay_result: 'Failed',
        assay_notes: input.assay_notes || null,
        verification_remarks: input.verification_remarks || null,
        verified_at: verifiedAtIso,
        verified_by: input.verified_by || 'Quality Verifier'
      })
      .eq('id', order_id)
      .select()
      .single();

    throw {
      status: 400,
      message: `Quality verification failed (${input.quality_grade} marked as ${input.assay_result}). Order placed on hold/dispute. Payout cannot be released.`,
      order: failedOrder || order
    };
  }

  // Update order to Quality Verified
  const updatedTrackingSteps = (order.tracking_steps || []).map((step: any, idx: number) => {
    if (idx <= 3) return { ...step, completed: true, current: false };
    if (idx === 4) return { ...step, completed: true, current: false, date: verifiedDateStr };
    if (idx === 5) return { ...step, completed: false, current: true };
    return step;
  });

  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'Quality Verified',
      actual_received_quantity: actualQty,
      actual_quantity_unit: unit,
      quality_grade: input.quality_grade,
      assay_result: 'Passed',
      assay_notes: input.assay_notes || null,
      verification_remarks: input.verification_remarks || null,
      verified_at: verifiedAtIso,
      verified_by: input.verified_by || 'Quality Verifier',
      tracking_steps: updatedTrackingSteps
    })
    .eq('id', order_id)
    .select()
    .single();

  if (updateError || !updatedOrder) {
    throw { status: 500, message: `Failed to update order verification: ${updateError?.message}` };
  }

  return {
    order: updatedOrder as OrderRecord,
    assay: finalAssay,
    weighment: finalWeighment
  };
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

  let finalAssay = data as QualityAssayRecord;
  if (error || !finalAssay) {
    const list = memoryAssays.get(order_id) || [];
    list.push(payload);
    memoryAssays.set(order_id, list);
    finalAssay = payload;
  }

  // Check if weighment already exists; if so, promote order to Quality Verified
  const { data: existingWb } = await supabase
    .from('order_weighments')
    .select('*')
    .eq('order_id', order_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const wb = existingWb || (memoryWeighments.get(order_id)?.[memoryWeighments.get(order_id)?.length! - 1]);

  if (wb && finalAssay.assay_passed) {
    await supabase
      .from('orders')
      .update({
        status: 'Quality Verified',
        actual_received_quantity: wb.net_weight,
        actual_quantity_unit: wb.unit || order.unit || 'kg',
        quality_grade: finalAssay.tested_grade,
        assay_result: 'Passed',
        verified_at: new Date().toISOString(),
        verified_by: finalAssay.inspector_name
      })
      .eq('id', order_id);
  }

  return finalAssay;
}

// =========================================================================
// 7. RECORD WEIGHMENT (GATEKEEPER 2)
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

  const contractedQty = Number(order.quantity);
  const netWeight = weighmentInput.net_weight !== undefined && !isNaN(Number(weighmentInput.net_weight))
    ? Number(weighmentInput.net_weight)
    : (Number(weighmentInput.gross_weight || 0) - Number(weighmentInput.tare_weight || 0));
  const weighmentUnit = weighmentInput.unit || order.unit || 'kg';
  const contractedInKg = toKg(contractedQty, order.unit || 'kg');
  const netWeightInKg = toKg(netWeight, weighmentUnit);
  const varianceWeight = Math.round((netWeightInKg - contractedInKg) * 100) / 100;
  const variancePercentage = contractedInKg > 0 ? Math.round((varianceWeight / contractedInKg) * 10000) / 100 : 0;
  const isWeightVerified = Math.abs(variancePercentage) <= 5.0;

  const payload: WeighmentRecord = {
    id: `wb-${Date.now()}`,
    order_id,
    weighbridge_id: weighmentInput.weighbridge_id || undefined,
    weighbridge_name: weighmentInput.weighbridge_name,
    weighbridge_slip_id: weighmentInput.weighbridge_slip_id,
    weighbridge_slip_url: weighmentInput.weighbridge_slip_url || undefined,
    operator_name: weighmentInput.operator_name,
    contracted_weight: contractedQty,
    gross_weight: Number(weighmentInput.gross_weight || 0),
    tare_weight: Number(weighmentInput.tare_weight || 0),
    net_weight: netWeight,
    unit: weighmentUnit,
    variance_weight: varianceWeight,
    variance_percentage: variancePercentage,
    weight_verified: isWeightVerified,
    notes: weighmentInput.notes || undefined,
    verified_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('order_weighments')
    .insert([payload])
    .select()
    .single();

  let finalWb = data as WeighmentRecord;
  if (error || !finalWb) {
    const list = memoryWeighments.get(order_id) || [];
    list.push(payload);
    memoryWeighments.set(order_id, list);
    finalWb = payload;
  }

  // Check if quality assay already exists; if so, promote order to Quality Verified
  const { data: existingAssay } = await supabase
    .from('order_quality_assays')
    .select('*')
    .eq('order_id', order_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const assay = existingAssay || (memoryAssays.get(order_id)?.[memoryAssays.get(order_id)?.length! - 1]);

  if (assay && assay.assay_passed) {
    await supabase
      .from('orders')
      .update({
        status: 'Quality Verified',
        actual_received_quantity: finalWb.net_weight,
        actual_quantity_unit: finalWb.unit || order.unit || 'kg',
        quality_grade: assay.tested_grade,
        assay_result: 'Passed',
        verified_at: new Date().toISOString(),
        verified_by: assay.inspector_name
      })
      .eq('id', order_id);
  }

  return finalWb;
}

export async function getOrderDispatch(order_id: string): Promise<OrderDispatchRecord | null> {
  const { data, error } = await supabase
    .from('order_dispatches')
    .select('*')
    .eq('order_id', order_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    const list = memoryDispatches.get(order_id) || [];
    return list[list.length - 1] || null;
  }
  return data as OrderDispatchRecord;
}

// =========================================================================
// 8. CONDITIONAL SMART PAYOUT RELEASE (BUYER ACTION)
// =========================================================================
export interface ReleaseSmartPayoutInput {
  order_id: string;
  user_id?: string;
  user_role?: string;
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

  // Role validation: Buyer only
  if (input.user_role && input.user_role.toLowerCase() !== 'buyer' && input.user_role.toLowerCase() !== 'admin') {
    throw { status: 403, message: 'Unauthorized: Only the buyer can release payout for this order.' };
  }

  // 2. Pre-condition Checks & Idempotency
  if (order.status === 'Completed' || order.payment_status === 'Released') {
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
    throw { status: 400, message: `Cannot release payout: Escrow status is '${order.payment_status}'. Escrow must be locked before payout can be released.` };
  }

  // Check Gatekeepers (Quality Assay & Weighment)
  const { data: dbAssay } = await supabase
    .from('order_quality_assays')
    .select('*')
    .eq('order_id', order_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const assay = dbAssay || (memoryAssays.get(order_id)?.[memoryAssays.get(order_id)?.length! - 1]);

  const { data: dbWb } = await supabase
    .from('order_weighments')
    .select('*')
    .eq('order_id', order_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const weighment = dbWb || (memoryWeighments.get(order_id)?.[memoryWeighments.get(order_id)?.length! - 1]);

  if (!assay && order.status !== 'Quality Verified') {
    throw { status: 400, message: 'Cannot release payout: Destination quality assay report is missing.' };
  }

  if (!weighment && order.status !== 'Quality Verified') {
    throw { status: 400, message: 'Cannot release payout: Weighment verification is required.' };
  }

  if (order.status !== 'Quality Verified' && (!assay || !weighment)) {
    throw { status: 400, message: `Cannot release payout: Order status is '${order.status}'. Weight & quality must be verified before releasing payout.` };
  }

  // Check Assay result directly from order or assay records
  const orderAssayResult = order.assay_result || (assay?.assay_passed ? 'Passed' : 'Failed');
  if (orderAssayResult.toLowerCase() === 'failed' || (assay && !assay.assay_passed)) {
    throw { status: 400, message: 'Quality verification failed. Payout cannot be released.' };
  }

  // 3. Calculate Final Payout Amount based on verified received quantity and unit normalization
  let normalizedQty = order.actual_received_quantity ? Number(order.actual_received_quantity) : Number(order.quantity);
  if (order.actual_received_quantity && order.actual_quantity_unit) {
    const orderUnit = (order.unit || 'kg').toLowerCase();
    const actualUnit = (order.actual_quantity_unit || 'kg').toLowerCase();
    if (orderUnit !== actualUnit) {
      const inKg = toKg(normalizedQty, actualUnit);
      const factor = UNIT_TO_KG_MAP[orderUnit] || 1;
      normalizedQty = inKg / factor;
    }
  }

  const pricePerUnit = Number(order.price_per_unit);
  const calculatedPayout = Math.round(normalizedQty * pricePerUnit * 100) / 100;
  const payoutAmount = calculatedPayout > 0 ? calculatedPayout : Number(order.total_amount);

  const idempotencyKey = input.idempotency_key || `payout-${order_id}-${Date.now()}`;
  const txRef = `TX-PAY-${Date.now().toString().slice(-8)}`;

  // 4. ATOMIC STATUS TRANSITION
  const updatedTrackingSteps = (order.tracking_steps || []).map((step: any) => {
    return { ...step, completed: true, current: false };
  });

  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'Completed',
      payment_status: 'Released',
      payout_status: 'Released',
      payout_amount: payoutAmount,
      payout_released_at: new Date().toISOString(),
      payout_released_by: input.user_id || 'Smart Escrow Contract',
      payout_reference: txRef,
      tracking_steps: updatedTrackingSteps
    })
    .eq('id', order_id)
    .select()
    .single();

  if (updateError || !updatedOrder) {
    throw { status: 500, message: `Failed to release smart payout: ${updateError?.message}` };
  }

  // 5. Write Append-Only Ledger Entry
  const transactionPayload: OrderTransactionRecord = {
    id: `tx-${Date.now()}`,
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
    notes: input.notes || `Conditional smart payout released to farmer for Order #${order.order_number}`,
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
  
  let normalizedDeliveredQty = deliveredNetWeight;
  if (deliveredNetWeight !== undefined) {
    const orderUnit = (order.unit || 'kg').toLowerCase();
    const weighmentUnit = (weighment?.unit || order.unit || 'kg').toLowerCase();
    if (orderUnit !== weighmentUnit) {
      const inKg = toKg(deliveredNetWeight, weighmentUnit);
      const factor = UNIT_TO_KG_MAP[orderUnit] || 1;
      normalizedDeliveredQty = inKg / factor;
    }
  }
  const verifiedDeliveryAmount = normalizedDeliveredQty !== undefined ? Math.round(normalizedDeliveredQty * pricePerUnit * 100) / 100 : grossContractAmount;
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
