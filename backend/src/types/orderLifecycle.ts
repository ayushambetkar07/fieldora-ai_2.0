export type OrderStatus =
  | 'Confirmed'
  | 'Transport Confirmed'
  | 'Escrow Locked'
  | 'In Transit'
  | 'Arrived'
  | 'Delivered'
  | 'Quality Verified'
  | 'Completed'
  | 'Cancelled'
  | 'Disputed';

export type PaymentStatus =
  | 'Pending'
  | 'Escrow Locked'
  | 'Released'
  | 'Refunded'
  | 'Disputed';

export type TransactionType =
  | 'escrow_deposit'
  | 'farmer_payout'
  | 'logistics_payment'
  | 'platform_fee'
  | 'assay_fee'
  | 'refund';

export interface TrackingStep {
  title: string;
  description: string;
  date?: string;
  completed: boolean;
  current: boolean;
  timestamp?: string;
}

export interface OrderRecord {
  id: string;
  order_number: string;
  request_id?: string | null;
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
  order_date?: string | null;
  expected_delivery_date?: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  transport_confirmed?: boolean;
  transport_confirmed_at?: string | null;
  transport_confirmed_by?: string | null;
  escrow_deposit_amount?: number;
  escrow_locked_at?: string | null;
  arrived_at?: string | null;
  arrived_by?: string | null;
  arrival_remarks?: string | null;
  actual_received_quantity?: number | null;
  actual_quantity_unit?: string | null;
  quality_grade?: string | null;
  assay_result?: string | null;
  assay_notes?: string | null;
  verification_remarks?: string | null;
  verified_at?: string | null;
  verified_by?: string | null;
  payout_status?: string | null;
  payout_amount?: number | null;
  payout_released_at?: string | null;
  payout_released_by?: string | null;
  payout_reference?: string | null;
  tracking_steps?: TrackingStep[];
  created_at?: string;
  updated_at?: string;
}

export interface OrderDispatchInput {
  vehicle_id?: string;
  vehicle_name: string;
  vehicle_type: string;
  vehicle_number: string;
  driver_name: string;
  driver_phone: string;
  pickup_location: string;
  delivery_location: string;
  pickup_node_id?: string;
  delivery_node_id?: string;
  route_id?: string;
  estimated_distance_km?: number;
  estimated_duration_minutes?: number;
  estimated_toll_cost?: number;
}

export interface OrderDispatchRecord extends OrderDispatchInput {
  id: string;
  order_id: string;
  dispatched_at: string;
  delivered_at?: string | null;
  status: 'Assigned' | 'Dispatched' | 'In Transit' | 'Delivered';
  created_at: string;
}

export interface GpsTelemetryInput {
  dispatch_id?: string;
  latitude: number;
  longitude: number;
  speed_kmh?: number;
  heading?: number;
  checkpoint_name?: string;
  progress_percent?: number;
  eta?: string;
}

export interface GpsTelemetryRecord extends GpsTelemetryInput {
  id: string;
  order_id: string;
  recorded_at: string;
}

export interface QualityAssayInput {
  inspector_id?: string;
  inspector_name: string;
  lab_name: string;
  tested_grade: string;
  target_grade: string;
  moisture_percentage?: number;
  foreign_matter_percentage?: number;
  certificate_number?: string;
  certificate_url?: string;
  assay_passed: boolean;
  notes?: string;
}

export interface QualityAssayRecord extends QualityAssayInput {
  id: string;
  order_id: string;
  verified_at: string;
  created_at: string;
}

export interface WeighmentInput {
  weighbridge_id?: string;
  weighbridge_name: string;
  weighbridge_slip_id: string;
  weighbridge_slip_url?: string;
  operator_name?: string;
  gross_weight: number;
  tare_weight: number;
  net_weight?: number;
  unit?: string;
  notes?: string;
}

export interface WeighmentRecord {
  id: string;
  order_id: string;
  weighbridge_id?: string;
  weighbridge_name: string;
  weighbridge_slip_id: string;
  weighbridge_slip_url?: string;
  operator_name?: string;
  contracted_weight: number;
  gross_weight: number;
  tare_weight: number;
  net_weight: number;
  unit: string;
  variance_weight: number;
  variance_percentage: number;
  weight_verified: boolean;
  notes?: string;
  verified_at: string;
  created_at: string;
}

export interface OrderTransactionRecord {
  id: string;
  transaction_reference: string;
  order_id: string;
  sender_id?: string | null;
  sender_role: string;
  recipient_id?: string | null;
  recipient_role: string;
  transaction_type: TransactionType;
  amount: number;
  currency: string;
  status: 'pending' | 'settled' | 'failed' | 'refunded';
  idempotency_key: string;
  notes?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface OrderInvoiceSummary {
  order_id: string;
  order_number: string;
  invoice_number: string;
  invoice_date: string;
  buyer: {
    name: string;
    company?: string;
    location?: string;
  };
  farmer: {
    name: string;
    farm?: string;
    location?: string;
  };
  commodity: {
    crop: string;
    variety?: string;
    contracted_quantity: number;
    delivered_net_weight?: number;
    unit: string;
    price_per_unit: number;
  };
  financial_breakdown: {
    gross_contract_amount: number;
    verified_delivery_amount?: number;
    logistics_cost: number;
    escrow_deposit_paid: number;
    net_farmer_payout: number;
    escrow_status: PaymentStatus;
  };
  verification_summary: {
    quality_assay_passed: boolean;
    quality_grade_certified?: string;
    weighment_verified: boolean;
    weighment_slip_id?: string;
  };
  settlement_status: string;
  transaction_references: string[];
}
