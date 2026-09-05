-- =========================================================================
-- Fieldora Comprehensive Database Schema & Smart Escrow Order Lifecycle
-- =========================================================================

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Produce Listings (Farmers selling crops)
CREATE TABLE IF NOT EXISTS produce_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID, -- References auth.users or profiles
  farmer_name VARCHAR,
  farm_name VARCHAR,
  is_farmer_verified BOOLEAN DEFAULT true,
  crop VARCHAR NOT NULL,
  crop_name TEXT,
  variety VARCHAR,
  category VARCHAR,
  quantity NUMERIC NOT NULL CHECK (quantity >= 0),
  unit VARCHAR DEFAULT 'kg',
  expected_price NUMERIC NOT NULL CHECK (expected_price >= 0),
  market_reference_price NUMERIC,
  location VARCHAR NOT NULL,
  quality VARCHAR,
  harvest_date DATE,
  delivery_option VARCHAR,
  description TEXT,
  image_url TEXT,
  moisture_percentage NUMERIC,
  status VARCHAR NOT NULL DEFAULT 'Active',
  is_verified BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_produce_listings_updated_at ON produce_listings;
CREATE TRIGGER set_produce_listings_updated_at
BEFORE UPDATE ON produce_listings
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE INDEX IF NOT EXISTS idx_produce_listings_status_verified ON produce_listings(status, is_verified);
CREATE INDEX IF NOT EXISTS idx_produce_listings_crop ON produce_listings(crop);
CREATE INDEX IF NOT EXISTS idx_produce_listings_location ON produce_listings(location);
CREATE INDEX IF NOT EXISTS idx_produce_listings_created_at ON produce_listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_produce_listings_farmer_id ON produce_listings(farmer_id);

-- 2. Buyer Requirements (RFQs & Procurement Tenders)
CREATE TABLE IF NOT EXISTS buyer_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID,
  buyer_name VARCHAR,
  company_name VARCHAR,
  is_buyer_verified BOOLEAN DEFAULT true,
  crop VARCHAR,
  crop_name TEXT NOT NULL,
  variety VARCHAR,
  quantity NUMERIC,
  required_quantity NUMERIC NOT NULL CHECK (required_quantity > 0),
  unit VARCHAR NOT NULL DEFAULT 'kg',
  target_price NUMERIC CHECK (target_price >= 0),
  quality_requirements VARCHAR DEFAULT 'Grade A',
  delivery_location VARCHAR NOT NULL,
  required_by_date DATE,
  payment_terms VARCHAR,
  description TEXT,
  status VARCHAR NOT NULL DEFAULT 'open',
  matching_score INTEGER DEFAULT 90,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_buyer_requirements_updated_at ON buyer_requirements;
CREATE TRIGGER set_buyer_requirements_updated_at
BEFORE UPDATE ON buyer_requirements
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE INDEX IF NOT EXISTS idx_buyer_requirements_status ON buyer_requirements(status);
CREATE INDEX IF NOT EXISTS idx_buyer_requirements_crop_name ON buyer_requirements(crop_name);
CREATE INDEX IF NOT EXISTS idx_buyer_requirements_delivery_location ON buyer_requirements(delivery_location);
CREATE INDEX IF NOT EXISTS idx_buyer_requirements_buyer_id ON buyer_requirements(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_requirements_created_at ON buyer_requirements(created_at DESC);

-- 3. Demand Alerts (Matching Farmer Notifications)
CREATE TABLE IF NOT EXISTS demand_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID,
  requirement_id UUID NOT NULL REFERENCES buyer_requirements(id) ON DELETE CASCADE,
  crop_name TEXT NOT NULL,
  variety TEXT,
  required_quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  delivery_location TEXT,
  target_price NUMERIC,
  match_percentage NUMERIC NOT NULL,
  scores JSONB NOT NULL,
  distance_km NUMERIC,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_demand_alerts_farmer_requirement 
ON demand_alerts(farmer_id, requirement_id);
CREATE INDEX IF NOT EXISTS idx_demand_alerts_farmer_read ON demand_alerts(farmer_id, read);
CREATE INDEX IF NOT EXISTS idx_demand_alerts_created_at ON demand_alerts(created_at DESC);

-- 4. Purchase Requests (Deal Procurement & Negotiation)
CREATE TABLE IF NOT EXISTS purchase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produce_id UUID REFERENCES produce_listings(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES produce_listings(id) ON DELETE SET NULL,
  requirement_id UUID REFERENCES buyer_requirements(id) ON DELETE SET NULL,
  crop_name VARCHAR,
  buyer_id UUID,
  buyer_name VARCHAR,
  buyer_company VARCHAR,
  is_buyer_verified BOOLEAN DEFAULT true,
  farmer_id UUID,
  farmer_name VARCHAR,
  requested_quantity NUMERIC NOT NULL CHECK (requested_quantity > 0),
  unit VARCHAR DEFAULT 'kg',
  offered_price NUMERIC CHECK (offered_price >= 0),
  offered_price_per_unit NUMERIC CHECK (offered_price_per_unit >= 0),
  total_offer_amount NUMERIC CHECK (total_offer_amount >= 0),
  current_quantity NUMERIC,
  current_price_per_unit NUMERIC,
  current_total_amount NUMERIC,
  current_offer_by VARCHAR(20) DEFAULT 'buyer',
  agreed_quantity NUMERIC,
  agreed_price_per_unit NUMERIC,
  agreed_total_amount NUMERIC,
  delivery_location VARCHAR,
  required_date DATE,
  message TEXT,
  status VARCHAR NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_purchase_requests_updated_at ON purchase_requests;
CREATE TRIGGER set_purchase_requests_updated_at
BEFORE UPDATE ON purchase_requests
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE INDEX IF NOT EXISTS idx_purchase_requests_buyer_id ON purchase_requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_farmer_id ON purchase_requests(farmer_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_listing_id ON purchase_requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_created_at ON purchase_requests(created_at DESC);

-- 5. Purchase Request Offers (Negotiation History)
CREATE TABLE IF NOT EXISTS purchase_request_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_request_id UUID NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
  offered_by_user_id UUID,
  offered_by_role TEXT NOT NULL CHECK (offered_by_role IN ('buyer', 'farmer')),
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'kg',
  price_per_unit NUMERIC NOT NULL CHECK (price_per_unit >= 0),
  total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
  message TEXT,
  offer_status TEXT NOT NULL DEFAULT 'active' CHECK (offer_status IN ('active', 'superseded', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offers_request_id ON purchase_request_offers(purchase_request_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_offers_status ON purchase_request_offers(offer_status);

-- 6. Orders (Base Order Contracts & Smart Escrow State)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR UNIQUE NOT NULL,
  request_id UUID UNIQUE REFERENCES purchase_requests(id) ON DELETE SET NULL,
  produce_id UUID REFERENCES produce_listings(id) ON DELETE SET NULL,
  crop VARCHAR NOT NULL,
  variety VARCHAR,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  unit VARCHAR NOT NULL DEFAULT 'kg',
  price_per_unit NUMERIC NOT NULL CHECK (price_per_unit >= 0),
  total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
  farmer_id UUID,
  farmer_name VARCHAR,
  farmer_farm VARCHAR,
  buyer_id UUID,
  buyer_name VARCHAR,
  buyer_company VARCHAR,
  delivery_location VARCHAR,
  order_date VARCHAR,
  expected_delivery_date VARCHAR,
  status VARCHAR NOT NULL DEFAULT 'Confirmed' CHECK (status IN ('Confirmed', 'In Transit', 'Delivered', 'Completed', 'Cancelled', 'Disputed')),
  payment_status VARCHAR NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Escrow Locked', 'Released', 'Refunded', 'Disputed')),
  escrow_deposit_amount NUMERIC DEFAULT 0 CHECK (escrow_deposit_amount >= 0),
  escrow_locked_at TIMESTAMPTZ,
  payout_released_at TIMESTAMPTZ,
  tracking_steps JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_orders_updated_at ON orders;
CREATE TRIGGER set_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE INDEX IF NOT EXISTS idx_orders_request_id ON orders(request_id);
CREATE INDEX IF NOT EXISTS idx_orders_farmer_id ON orders(farmer_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- 7. Order Dispatches (Logistics & Fleet Assignment)
CREATE TABLE IF NOT EXISTS order_dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  vehicle_id VARCHAR,
  vehicle_name VARCHAR NOT NULL,
  vehicle_type VARCHAR NOT NULL,
  vehicle_number VARCHAR NOT NULL,
  driver_name VARCHAR NOT NULL,
  driver_phone VARCHAR NOT NULL,
  pickup_location VARCHAR NOT NULL,
  delivery_location VARCHAR NOT NULL,
  pickup_node_id VARCHAR,
  delivery_node_id VARCHAR,
  route_id VARCHAR,
  estimated_distance_km NUMERIC,
  estimated_duration_minutes NUMERIC,
  estimated_toll_cost NUMERIC DEFAULT 0,
  dispatched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  status VARCHAR NOT NULL DEFAULT 'Dispatched' CHECK (status IN ('Assigned', 'Dispatched', 'In Transit', 'Delivered')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_dispatches_order_id ON order_dispatches(order_id);
CREATE INDEX IF NOT EXISTS idx_order_dispatches_status ON order_dispatches(status);

-- 8. Order GPS Telemetry (Real-Time Transit Checkpoints & Position Ingestion)
CREATE TABLE IF NOT EXISTS order_gps_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  dispatch_id UUID REFERENCES order_dispatches(id) ON DELETE SET NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  speed_kmh NUMERIC DEFAULT 0,
  heading NUMERIC,
  checkpoint_name VARCHAR,
  progress_percent NUMERIC DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  eta TIMESTAMPTZ,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gps_telemetry_order_id ON order_gps_telemetry(order_id, recorded_at DESC);

-- 9. Order Quality Assays (Destination Laboratory Assay & Quality Gate)
CREATE TABLE IF NOT EXISTS order_quality_assays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  inspector_id UUID,
  inspector_name VARCHAR NOT NULL,
  lab_name VARCHAR NOT NULL,
  tested_grade VARCHAR NOT NULL,
  target_grade VARCHAR NOT NULL,
  moisture_percentage NUMERIC,
  foreign_matter_percentage NUMERIC,
  certificate_number VARCHAR,
  certificate_url VARCHAR,
  assay_passed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quality_assays_order_id ON order_quality_assays(order_id);
CREATE INDEX IF NOT EXISTS idx_quality_assays_passed ON order_quality_assays(order_id, assay_passed);

-- 10. Order Weighments (Destination Weighbridge Slip & Verification Gate)
CREATE TABLE IF NOT EXISTS order_weighments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  weighbridge_name VARCHAR NOT NULL,
  weighbridge_slip_id VARCHAR NOT NULL,
  operator_name VARCHAR,
  contracted_weight NUMERIC NOT NULL,
  gross_weight NUMERIC NOT NULL CHECK (gross_weight >= 0),
  tare_weight NUMERIC NOT NULL CHECK (tare_weight >= 0),
  net_weight NUMERIC NOT NULL CHECK (net_weight >= 0),
  unit VARCHAR NOT NULL DEFAULT 'kg',
  variance_weight NUMERIC NOT NULL,
  variance_percentage NUMERIC NOT NULL,
  weight_verified BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weighments_order_id ON order_weighments(order_id);
CREATE INDEX IF NOT EXISTS idx_weighments_verified ON order_weighments(order_id, weight_verified);

-- 11. Order Transactions (Immutable Financial Audit Ledger)
CREATE TABLE IF NOT EXISTS order_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_reference VARCHAR UNIQUE NOT NULL,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender_id UUID,
  sender_role VARCHAR NOT NULL,
  recipient_id UUID,
  recipient_role VARCHAR NOT NULL,
  transaction_type VARCHAR NOT NULL CHECK (transaction_type IN ('escrow_deposit', 'farmer_payout', 'logistics_payment', 'platform_fee', 'assay_fee', 'refund')),
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  currency VARCHAR NOT NULL DEFAULT 'INR',
  status VARCHAR NOT NULL DEFAULT 'settled' CHECK (status IN ('pending', 'settled', 'failed', 'refunded')),
  idempotency_key VARCHAR UNIQUE NOT NULL,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_transactions_order_id ON order_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_order_transactions_type ON order_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_order_transactions_idempotency ON order_transactions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_order_transactions_created_at ON order_transactions(created_at DESC);

-- RLS Configuration
ALTER TABLE produce_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_request_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_gps_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_quality_assays ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_weighments ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for public demo / authenticated access
DROP POLICY IF EXISTS "Public view produce_listings" ON produce_listings;
CREATE POLICY "Public view produce_listings" ON produce_listings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert produce_listings" ON produce_listings;
CREATE POLICY "Public insert produce_listings" ON produce_listings FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update produce_listings" ON produce_listings;
CREATE POLICY "Public update produce_listings" ON produce_listings FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public view buyer_requirements" ON buyer_requirements;
CREATE POLICY "Public view buyer_requirements" ON buyer_requirements FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert buyer_requirements" ON buyer_requirements;
CREATE POLICY "Public insert buyer_requirements" ON buyer_requirements FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update buyer_requirements" ON buyer_requirements;
CREATE POLICY "Public update buyer_requirements" ON buyer_requirements FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public view demand_alerts" ON demand_alerts;
CREATE POLICY "Public view demand_alerts" ON demand_alerts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert demand_alerts" ON demand_alerts;
CREATE POLICY "Public insert demand_alerts" ON demand_alerts FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update demand_alerts" ON demand_alerts;
CREATE POLICY "Public update demand_alerts" ON demand_alerts FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public view purchase_requests" ON purchase_requests;
CREATE POLICY "Public view purchase_requests" ON purchase_requests FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert purchase_requests" ON purchase_requests;
CREATE POLICY "Public insert purchase_requests" ON purchase_requests FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update purchase_requests" ON purchase_requests;
CREATE POLICY "Public update purchase_requests" ON purchase_requests FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public view purchase_request_offers" ON purchase_request_offers;
CREATE POLICY "Public view purchase_request_offers" ON purchase_request_offers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert purchase_request_offers" ON purchase_request_offers;
CREATE POLICY "Public insert purchase_request_offers" ON purchase_request_offers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update purchase_request_offers" ON purchase_request_offers;
CREATE POLICY "Public update purchase_request_offers" ON purchase_request_offers FOR UPDATE USING (true);

-- Orders RLS Policies
DROP POLICY IF EXISTS "Public view orders" ON orders;
CREATE POLICY "Public view orders" ON orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert orders" ON orders;
CREATE POLICY "Public insert orders" ON orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update orders" ON orders;
CREATE POLICY "Public update orders" ON orders FOR UPDATE USING (true);

-- Order Dispatches RLS
DROP POLICY IF EXISTS "Public view order_dispatches" ON order_dispatches;
CREATE POLICY "Public view order_dispatches" ON order_dispatches FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert order_dispatches" ON order_dispatches;
CREATE POLICY "Public insert order_dispatches" ON order_dispatches FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update order_dispatches" ON order_dispatches;
CREATE POLICY "Public update order_dispatches" ON order_dispatches FOR UPDATE USING (true);

-- GPS Telemetry RLS
DROP POLICY IF EXISTS "Public view order_gps_telemetry" ON order_gps_telemetry;
CREATE POLICY "Public view order_gps_telemetry" ON order_gps_telemetry FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert order_gps_telemetry" ON order_gps_telemetry;
CREATE POLICY "Public insert order_gps_telemetry" ON order_gps_telemetry FOR INSERT WITH CHECK (true);

-- Quality Assays RLS
DROP POLICY IF EXISTS "Public view order_quality_assays" ON order_quality_assays;
CREATE POLICY "Public view order_quality_assays" ON order_quality_assays FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert order_quality_assays" ON order_quality_assays;
CREATE POLICY "Public insert order_quality_assays" ON order_quality_assays FOR INSERT WITH CHECK (true);

-- Weighments RLS
DROP POLICY IF EXISTS "Public view order_weighments" ON order_weighments;
CREATE POLICY "Public view order_weighments" ON order_weighments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert order_weighments" ON order_weighments;
CREATE POLICY "Public insert order_weighments" ON order_weighments FOR INSERT WITH CHECK (true);

-- Transactions RLS (Append-only)
DROP POLICY IF EXISTS "Public view order_transactions" ON order_transactions;
CREATE POLICY "Public view order_transactions" ON order_transactions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert order_transactions" ON order_transactions;
CREATE POLICY "Public insert order_transactions" ON order_transactions FOR INSERT WITH CHECK (true);

-- Enable Supabase Realtime Publications
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE produce_listings;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE buyer_requirements;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE demand_alerts;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE purchase_requests;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE purchase_request_offers;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE order_dispatches;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE order_gps_telemetry;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE order_quality_assays;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE order_weighments;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE order_transactions;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_trust_scores;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ==============================================================================
-- 13. Verified Reviews (Ratings & Feedback Ledger)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  reviewee_id UUID NOT NULL,
  reviewer_role VARCHAR NOT NULL CHECK (reviewer_role IN ('farmer', 'buyer')),
  communication_rating NUMERIC NOT NULL CHECK (communication_rating >= 1 AND communication_rating <= 5),
  quality_rating NUMERIC NOT NULL CHECK (quality_rating >= 1 AND quality_rating <= 5),
  reliability_rating NUMERIC NOT NULL CHECK (reliability_rating >= 1 AND reliability_rating <= 5),
  timeliness_rating NUMERIC NOT NULL CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
  overall_rating NUMERIC NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  comment TEXT,
  verified_trade BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_order_reviewer UNIQUE (order_id, reviewer_id)
);

DROP TRIGGER IF EXISTS set_reviews_updated_at ON reviews;
CREATE TRIGGER set_reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_verified_trade ON reviews(verified_trade);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- ==============================================================================
-- 14. User Trust Scores (Aggregated Verified Performance Metrics)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS user_trust_scores (
  user_id UUID PRIMARY KEY,
  role VARCHAR NOT NULL DEFAULT 'all' CHECK (role IN ('farmer', 'buyer', 'all')),
  verified_review_count INTEGER NOT NULL DEFAULT 0,
  average_overall_rating NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  communication_score NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  quality_score NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  reliability_score NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  timeliness_score NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  trust_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_trust_scores_trust ON user_trust_scores(trust_score DESC);

-- RLS for Reviews & Trust Scores
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trust_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view reviews" ON reviews;
CREATE POLICY "Public view reviews" ON reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert reviews" ON reviews;
CREATE POLICY "Public insert reviews" ON reviews FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update reviews" ON reviews;
CREATE POLICY "Public update reviews" ON reviews FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Public delete reviews" ON reviews;
CREATE POLICY "Public delete reviews" ON reviews FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public view user_trust_scores" ON user_trust_scores;
CREATE POLICY "Public view user_trust_scores" ON user_trust_scores FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public upsert user_trust_scores" ON user_trust_scores;
CREATE POLICY "Public upsert user_trust_scores" ON user_trust_scores FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update user_trust_scores" ON user_trust_scores;
CREATE POLICY "Public update user_trust_scores" ON user_trust_scores FOR UPDATE USING (true);

