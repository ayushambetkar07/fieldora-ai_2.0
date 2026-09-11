import { supabase } from './dist/config/supabase.js';
import {
  createPurchaseRequest,
  acceptDeal
} from './dist/services/negotiationService.js';
import {
  createOrderFromDeal,
  confirmFarmerTransport,
  lockEscrowDeposit,
  dispatchOrderLogistics,
  markOrderArrived,
  verifyOrderQualityAndWeight,
  releaseSmartPayout,
  generateOrderInvoice,
  getOrderAuditTrail
} from './dist/services/orderLifecycleService.js';

async function runComprehensiveLifecycleTests() {
  console.log('========================================================================');
  console.log('🧪 RUNNING COMPREHENSIVE ORDER & SMART ESCROW WORKFLOW VERIFICATION SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // Setup Test Listing
    // -------------------------------------------------------------
    console.log('--- Setup: Test Produce Listing ---');
    const { data: listing, error: listingErr } = await supabase
      .from('produce_listings')
      .insert([{
        crop: 'Shimla Grade A Apples',
        variety: 'Royal Delicious',
        quantity: 500,
        unit: 'kg',
        expected_price: 120,
        location: 'Shimla APMC, Himachal Pradesh',
        quality: 'Grade A',
        delivery_option: 'Direct Delivery',
        status: 'Active'
      }])
      .select()
      .single();

    if (listingErr || !listing) throw listingErr || new Error('Failed to create test listing');
    assert(Boolean(listing && listing.id), `Produce Listing created: ${listing.crop} (ID: ${listing.id})`);

    // -------------------------------------------------------------
    // TEST 1: Accepted purchase request creates exactly ONE order
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Purchase Request & Deal Acceptance -> Exactly 1 Order ---');
    const requestResult = await createPurchaseRequest({
      listing_id: listing.id,
      buyer_id: '8996d084-1f18-45bd-995a-27ac039436ce',
      buyer_name: 'BigBasket Fresh Hub',
      buyer_company: 'Innovative Retail Concepts Pvt Ltd',
      requested_quantity: 500,
      unit: 'kg',
      offered_price_per_unit: 110,
      delivery_location: 'Vashi Hub, Navi Mumbai',
      message: 'Direct buy offer for 500 kg @ ₹110/kg'
    });

    assert(Boolean(requestResult && requestResult.id), `Purchase Request created: ID ${requestResult.id}`);

    const dealAccepted = await acceptDeal({
      purchase_request_id: requestResult.id,
      user_id: listing.farmer_id || '039b5a52-cfab-42df-9cbc-22214e210de5',
      role: 'farmer'
    });

    assert(Boolean(dealAccepted && dealAccepted.order), 'Order created upon deal acceptance');
    assert(dealAccepted.order.status === 'Confirmed', `Order initial status is 'Confirmed'`);
    assert(dealAccepted.order.quantity === 500, `Order quantity is 500 kg`);
    assert(dealAccepted.order.price_per_unit === 110, `Order price_per_unit is ₹110/kg`);
    assert(dealAccepted.order.total_amount === 55000, `Order total_amount is ₹55,000`);

    const orderId = dealAccepted.order.id;

    // Idempotency: Calling createOrderFromDeal again returns the same existing order without duplicates
    const duplicateOrder = await createOrderFromDeal({
      request_id: requestResult.id,
      produce_id: listing.id,
      crop: 'Shimla Grade A Apples',
      quantity: 500,
      unit: 'kg',
      price_per_unit: 110,
      total_amount: 55000,
      farmer_id: listing.farmer_id || '039b5a52-cfab-42df-9cbc-22214e210de5',
      buyer_id: '8996d084-1f18-45bd-995a-27ac039436ce'
    });
    assert(duplicateOrder.id === orderId, `Idempotent creation: exact same Order #${orderId} returned`);

    // Verify orders table has exactly 1 order for this request_id
    const { data: orderList } = await supabase
      .from('orders')
      .select('id')
      .eq('request_id', requestResult.id);
    assert(orderList && orderList.length === 1, `Verified database contains exactly 1 order for request_id (no duplicates)`);

    // -------------------------------------------------------------
    // TEST 9: Invalid Transition Test -> Mark Arrived before In Transit (Must Fail)
    // -------------------------------------------------------------
    console.log('\n--- TEST 9: Invalid Transition: Mark Arrived before In Transit ---');
    try {
      await markOrderArrived(orderId);
      assert(false, 'Expected error when marking arrived while status is Confirmed');
    } catch (err) {
      assert(true, `Correctly rejected premature arrival: ${err.message}`);
    }

    // -------------------------------------------------------------
    // TEST 10: Invalid Transition Test -> Verify before Arrived (Must Fail)
    // -------------------------------------------------------------
    console.log('\n--- TEST 10: Invalid Transition: Verify before Arrived ---');
    try {
      await verifyOrderQualityAndWeight(orderId, {
        actual_received_quantity: 492,
        actual_quantity_unit: 'kg',
        quality_grade: 'Grade A',
        assay_result: 'Passed'
      });
      assert(false, 'Expected error when verifying while status is Confirmed');
    } catch (err) {
      assert(true, `Correctly rejected premature verification: ${err.message}`);
    }

    // -------------------------------------------------------------
    // TEST 11: Invalid Transition Test -> Release Payout before Verification (Must Fail)
    // -------------------------------------------------------------
    console.log('\n--- TEST 11: Invalid Transition: Release Payout before Verification ---');
    try {
      await releaseSmartPayout({ order_id: orderId });
      assert(false, 'Expected error when releasing payout while status is Confirmed');
    } catch (err) {
      assert(true, `Correctly rejected premature payout: ${err.message}`);
    }

    // -------------------------------------------------------------
    // TEST 1.1: Buyer cannot lock escrow before Farmer confirms transport (Must Fail)
    // -------------------------------------------------------------
    console.log('\n--- TEST 1.1: Prerequisite Check: Buyer cannot lock escrow before Farmer confirms transport ---');
    try {
      await lockEscrowDeposit({
        order_id: orderId,
        user_role: 'buyer',
        deposit_amount: 55000
      });
      assert(false, 'Expected error when locking escrow before Farmer confirmed transport');
    } catch (err) {
      assert(true, `Correctly rejected premature escrow lock: ${err.message}`);
    }

    // -------------------------------------------------------------
    // TEST 1.2: Farmer unauthorized to perform buyer actions (Must Fail)
    // -------------------------------------------------------------
    console.log('\n--- TEST 1.2: Role Boundaries: Farmer cannot perform Buyer actions ---');
    try {
      await lockEscrowDeposit({ order_id: orderId, user_role: 'farmer' });
      assert(false, 'Expected Farmer to be blocked from locking escrow');
    } catch (err) {
      assert(true, `Farmer correctly blocked from locking escrow: ${err.message}`);
    }

    try {
      await dispatchOrderLogistics(orderId, { vehicle_name: 'Truck' }, 'farmer');
      assert(false, 'Expected Farmer to be blocked from dispatching transport');
    } catch (err) {
      assert(true, `Farmer correctly blocked from dispatching transport: ${err.message}`);
    }

    try {
      await releaseSmartPayout({ order_id: orderId, user_role: 'farmer' });
      assert(false, 'Expected Farmer to be blocked from releasing payout');
    } catch (err) {
      assert(true, `Farmer correctly blocked from releasing payout: ${err.message}`);
    }

    // -------------------------------------------------------------
    // TEST 1.3: FARMER Confirms Transport
    // -------------------------------------------------------------
    console.log('\n--- TEST 1.3: FARMER Confirms Transport ---');
    const farmerConfirmResult = await confirmFarmerTransport(orderId, {
      confirmed_by: 'Farmer Ramesh',
      user_role: 'farmer'
    });
    assert(farmerConfirmResult.transport_confirmed === true, `Order transport_confirmed is true`);
    assert(farmerConfirmResult.status === 'Transport Confirmed', `Order status updated to 'Transport Confirmed'`);

    // -------------------------------------------------------------
    // TEST 2: Buyer locks escrow (Now permitted)
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Lock Escrow Deposit by Buyer ---');
    const escrowResult = await lockEscrowDeposit({
      order_id: orderId,
      user_role: 'buyer',
      deposit_amount: 55000,
      notes: 'Buyer locked 100% contract funds in simulated escrow vault'
    });
    assert(escrowResult.order.payment_status === 'Escrow Locked', `Escrow payment status updated to 'Escrow Locked'`);
    assert(Boolean(escrowResult.transaction && escrowResult.transaction.transaction_reference), `Transaction logged: ${escrowResult.transaction?.transaction_reference}`);

    // -------------------------------------------------------------
    // TEST 3: Shipment is dispatched
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Logistics Dispatch ---');
    const dispatchResult = await dispatchOrderLogistics(orderId, {
      vehicle_name: 'Tata 407 Reefer Truck',
      vehicle_type: 'Refrigerated Carrier',
      vehicle_number: 'HP-01-AB-4321',
      driver_name: 'Rameshwar Singh',
      driver_phone: '+91 98160 55443',
      pickup_location: 'Shimla APMC, Himachal Pradesh',
      delivery_location: 'Vashi Hub, Navi Mumbai',
      estimated_distance_km: 1750,
      estimated_duration_minutes: 2400,
      estimated_toll_cost: 3200
    });
    assert(dispatchResult.order.status === 'In Transit', `Order status progressed to 'In Transit'`);

    // -------------------------------------------------------------
    // TEST 4: Click Mark Arrived
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Mark Arrived at Destination ---');
    const arrivedResult = await markOrderArrived(orderId, {
      arrived_by: 'Inspector Vashi Mandi',
      arrival_remarks: 'Carrier arrived at Vashi Gate 4. Seals inspected and intact.'
    });
    assert(arrivedResult.status === 'Arrived', `Order status progressed to 'Arrived'`);
    assert(Boolean(arrivedResult.arrived_at), `Arrived timestamp recorded: ${arrivedResult.arrived_at}`);
    assert(arrivedResult.arrived_by === 'Inspector Vashi Mandi', `Arrived by recorded: ${arrivedResult.arrived_by}`);

    // -------------------------------------------------------------
    // TEST 12: Quality Assay Failure Handling
    // -------------------------------------------------------------
    console.log('\n--- TEST 12: Failed Quality Assay Retains Hold / Prevents Payout ---');
    const { data: failedListing } = await supabase
      .from('produce_listings')
      .insert([{
        crop: 'Shimla Grade B Apples',
        variety: 'Golden Delicious',
        quantity: 100,
        unit: 'kg',
        expected_price: 90,
        location: 'Shimla APMC, Himachal Pradesh',
        quality: 'Grade B',
        delivery_option: 'Direct Delivery',
        status: 'Active'
      }])
      .select()
      .single();

    const failedReq = await createPurchaseRequest({
      listing_id: failedListing.id,
      buyer_id: '8996d084-1f18-45bd-995a-27ac039436ce',
      buyer_name: 'Test Buyer',
      requested_quantity: 100,
      unit: 'kg',
      offered_price_per_unit: 100,
      delivery_location: 'Vashi Hub'
    });
    const failedDeal = await acceptDeal({ purchase_request_id: failedReq.id, user_id: '039b5a52-cfab-42df-9cbc-22214e210de5', role: 'farmer' });
    await confirmFarmerTransport(failedDeal.order.id, { confirmed_by: 'Farmer', user_role: 'farmer' });
    await lockEscrowDeposit({ order_id: failedDeal.order.id, user_role: 'buyer' });
    await dispatchOrderLogistics(failedDeal.order.id, { vehicle_name: 'Van', vehicle_type: 'Van', vehicle_number: 'MH-04-1234', driver_name: 'Driver', driver_phone: '+91 99999 88888', pickup_location: 'Farm', delivery_location: 'Hub' });
    await markOrderArrived(failedDeal.order.id, { user_role: 'buyer' });
    
    try {
      await verifyOrderQualityAndWeight(failedDeal.order.id, {
        actual_received_quantity: 90,
        actual_quantity_unit: 'kg',
        quality_grade: 'Grade C',
        assay_result: 'Failed',
        assay_notes: 'Excessive bruising and moisture detected. Grade standard not met.'
      });
      assert(false, 'Expected verifyOrderQualityAndWeight to throw on Failed assay');
    } catch (err) {
      assert(true, `Failed assay properly caught & rejected: ${err.message}`);
    }

    // Attempting payout on failed order must be rejected
    try {
      await releaseSmartPayout({ order_id: failedDeal.order.id });
      assert(false, 'Expected payout to be rejected on failed assay');
    } catch (err) {
      assert(true, `Payout on failed order rejected: ${err.message}`);
    }

    // -------------------------------------------------------------
    // TEST 5: Verify Weight & Quality (Expected = 500 kg, Actual = 492 kg, Grade A, Passed)
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Verify Weight & Quality (492 kg, Grade A, Passed) ---');
    const verifyResult = await verifyOrderQualityAndWeight(orderId, {
      actual_received_quantity: 492,
      actual_quantity_unit: 'kg',
      quality_grade: 'Grade A',
      assay_result: 'Passed',
      assay_notes: 'Moisture 12.1%, zero foreign matter, Grade A certified.',
      verification_remarks: 'Destination weighbridge slip WB-492KG verified.'
    });
    assert(verifyResult.order.status === 'Quality Verified', `Order status progressed to 'Quality Verified'`);
    assert(verifyResult.order.actual_received_quantity === 492, `Verified quantity recorded: 492 kg`);
    assert(verifyResult.order.quality_grade === 'Grade A', `Quality grade recorded: Grade A`);
    assert(verifyResult.order.assay_result === 'Passed', `Assay result recorded: Passed`);
    assert(Boolean(verifyResult.order.verified_at), `Verified timestamp recorded: ${verifyResult.order.verified_at}`);

    // -------------------------------------------------------------
    // TEST 6: Release Payout with Calculated Amount (492 × ₹110 = ₹54,120)
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Release Smart Escrow Payout (Calculated Amount: 492 × ₹110 = ₹54,120) ---');
    const payoutResult = await releaseSmartPayout({
      order_id: orderId,
      notes: 'Smart payout released upon dual NABL assay & weighment verification'
    });
    assert(payoutResult.order.status === 'Completed', `Order status progressed to 'Completed'`);
    assert(payoutResult.order.payment_status === 'Released', `Payment status updated to 'Released'`);
    assert(payoutResult.order.payout_status === 'Released', `Payout status updated to 'Released'`);
    assert(payoutResult.order.payout_amount === 54120, `Payout amount accurately calculated as ₹54,120 (492 kg × ₹110)`);
    assert(payoutResult.transaction.amount === 54120, `Transaction ledger amount matches ₹54,120`);
    assert(Boolean(payoutResult.order.payout_reference), `Transaction reference generated: ${payoutResult.order.payout_reference}`);

    // -------------------------------------------------------------
    // TEST 7: Refresh & Verify Database Persistence
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Database State Persistence Check ---');
    const { data: reloadedOrder } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    assert(Boolean(reloadedOrder), 'Order fetched fresh from Supabase');
    assert(reloadedOrder.status === 'Completed', `Persisted status is 'Completed'`);
    assert(reloadedOrder.payment_status === 'Released', `Persisted payment_status is 'Released'`);
    assert(Number(reloadedOrder.actual_received_quantity) === 492, `Persisted actual_received_quantity is 492 kg`);
    assert(reloadedOrder.quality_grade === 'Grade A', `Persisted quality_grade is Grade A`);
    assert(reloadedOrder.assay_result === 'Passed', `Persisted assay_result is Passed`);
    assert(Number(reloadedOrder.payout_amount) === 54120, `Persisted payout_amount is ₹54,120`);

    // -------------------------------------------------------------
    // TEST 8: Idempotent Payout / Duplicate Release Protection
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: Idempotency & Duplicate Payout Protection ---');
    const duplicatePayout = await releaseSmartPayout({
      order_id: orderId,
      notes: 'Second click attempt'
    });
    assert(duplicatePayout.order.status === 'Completed', `Duplicate release safely returns completed order`);
    assert(duplicatePayout.transaction.transaction_reference === payoutResult.transaction.transaction_reference, `No duplicate ledger record created`);

    // Clean up test data
    await supabase.from('orders').delete().eq('id', orderId);
    await supabase.from('orders').delete().eq('id', failedDeal.order.id);
    await supabase.from('purchase_requests').delete().eq('id', requestResult.id);
    await supabase.from('produce_listings').delete().eq('id', listing.id);
    if (failedListing?.id) await supabase.from('produce_listings').delete().eq('id', failedListing.id);

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log('\n========================================================================');
  console.log(`📊 FINAL TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runComprehensiveLifecycleTests();
