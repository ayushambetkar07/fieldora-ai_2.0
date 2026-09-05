/**
 * Fieldora Comprehensive Automated Test Suite for Deal Negotiation & Counter-Offers
 */

async function runNegotiationTestSuite() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('🧪 Starting Fieldora Deal Negotiation & Counter-Offers Test Suite...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // SETUP: Seed a Fresh Produce Listing (Tomato 1,000 kg)
    // -------------------------------------------------------------
    console.log('--- Step 0: Seeding fresh test produce listing ---');
    const listingRes = await fetch(`${BASE_URL}/produce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farmer_name: 'Suresh Patil (Nashik Producer)',
        farm_name: 'Patil Agro Farm',
        crop: 'Tomato',
        variety: 'Grade A Hybrid',
        quantity: 1000,
        unit: 'kg',
        expected_price: 30,
        location: 'Nashik, Maharashtra',
        status: 'Active',
        is_verified: true
      })
    });
    const listingData = await listingRes.json();
    assert(listingRes.status === 201 && listingData.success, 'Seeded 1,000 kg Tomato listing');
    const listingId = listingData.data.id;
    const initialListingQty = listingData.data.quantity;

    // -------------------------------------------------------------
    // TEST 1: Invalid Quantity Rejection (Excessive request)
    // -------------------------------------------------------------
    console.log('\n--- Test 1: Excessive Quantity Rejection ---');
    const invalidQtyRes = await fetch(`${BASE_URL}/purchase-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: listingId,
        requested_quantity: 1500, // Exceeds 1000 kg
        unit: 'kg',
        offered_price_per_unit: 28,
        message: 'Need 1500 kg'
      })
    });
    assert(invalidQtyRes.status === 400, 'Rejects purchase request exceeding listing lot with 400 Bad Request');

    // -------------------------------------------------------------
    // TEST 2: Valid Purchase Request Creation (Round 1 - Buyer Offer)
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Valid Purchase Request Creation (Buyer Initial Offer) ---');
    const createReqRes = await fetch(`${BASE_URL}/purchase-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: listingId,
        buyer_name: 'FreshMart Procurement',
        buyer_company: 'FreshMart Ltd',
        requested_quantity: 500,
        unit: 'kg',
        offered_price_per_unit: 28,
        delivery_location: 'Mumbai Central Hub',
        message: 'Initial buyer procurement request: 500 kg @ ₹28/kg'
      })
    });
    const createReqData = await createReqRes.json();
    assert(createReqRes.status === 201 && createReqData.success, 'Created purchase request with 201 Created');
    assert(createReqData.data.status === 'pending', 'Initial status is "pending"');
    assert(createReqData.data.total_offer_amount === 14000, `Total calculated server-side: ₹${createReqData.data.total_offer_amount} === ₹14,000`);
    assert(createReqData.data.current_offer_by === 'buyer', 'Current offer set by "buyer"');
    const reqId = createReqData.data.id;

    // Verify initial offer in negotiation history
    const history1Res = await fetch(`${BASE_URL}/purchase-requests/${reqId}/offers`);
    const history1Data = await history1Res.json();
    assert(history1Res.status === 200 && history1Data.data.length === 1, 'Initial offer recorded in purchase_request_offers');
    assert(history1Data.data[0].offer_status === 'active', 'Initial offer is "active"');
    assert(history1Data.data[0].offered_by_role === 'buyer', 'Offer 1 role is "buyer"');

    // -------------------------------------------------------------
    // TEST 3: Farmer Counter-Offer (Round 2)
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Farmer Counter-Offer (Round 2) ---');
    const counter1Res = await fetch(`${BASE_URL}/purchase-requests/${reqId}/counter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'farmer',
        quantity: 450,
        unit: 'kg',
        price_per_unit: 30,
        message: 'Farmer counter: I can provide 450 kg at ₹30/kg'
      })
    });
    const counter1Data = await counter1Res.json();
    assert(counter1Res.status === 200 && counter1Data.success, 'Farmer counter-offer submitted successfully');
    assert(counter1Data.data.status === 'counter_offered', 'Request status transitioned to "counter_offered"');
    assert(counter1Data.data.current_offer.total_amount === 13500, `Counter total calculated: ₹${counter1Data.data.current_offer.total_amount} === ₹13,500`);

    // Verify history now has 2 records and first is superseded
    const history2Res = await fetch(`${BASE_URL}/purchase-requests/${reqId}/offers`);
    const history2Data = await history2Res.json();
    assert(history2Data.data.length === 2, 'Negotiation history contains 2 offers');
    assert(history2Data.data[0].offer_status === 'superseded', 'Previous offer marked as "superseded"');
    assert(history2Data.data[1].offer_status === 'active', 'Latest counter-offer is "active"');
    assert(history2Data.data[1].offered_by_role === 'farmer', 'Latest offer role is "farmer"');

    // -------------------------------------------------------------
    // TEST 4: Buyer Counter-Offer (Round 3)
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Buyer Counter-Offer (Round 3) ---');
    const counter2Res = await fetch(`${BASE_URL}/purchase-requests/${reqId}/counter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'buyer',
        quantity: 450,
        unit: 'kg',
        price_per_unit: 29,
        message: 'Buyer counter: Let us settle on 450 kg at ₹29/kg'
      })
    });
    const counter2Data = await counter2Res.json();
    assert(counter2Res.status === 200 && counter2Data.success, 'Buyer counter-offer submitted successfully');
    assert(counter2Data.data.current_offer.total_amount === 13050, `Round 3 total: ₹${counter2Data.data.current_offer.total_amount} === ₹13,050`);

    const history3Res = await fetch(`${BASE_URL}/purchase-requests/${reqId}/offers`);
    const history3Data = await history3Res.json();
    assert(history3Data.data.length === 3, 'Auditable history preserves all 3 negotiation rounds');

    // -------------------------------------------------------------
    // TEST 5: Accept Deal & Atomic Inventory Reduction (Round 4)
    // -------------------------------------------------------------
    console.log('\n--- Test 5: Accept Deal & Inventory Deduction ---');
    const acceptRes = await fetch(`${BASE_URL}/purchase-requests/${reqId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'farmer'
      })
    });
    const acceptData = await acceptRes.json();
    assert(acceptRes.status === 200 && acceptData.success, 'Deal accepted with 200 OK');
    assert(acceptData.data.status === 'accepted', 'Request status is "accepted"');
    assert(acceptData.data.agreed_quantity === 450, 'Final agreed quantity is 450 kg');
    assert(acceptData.data.agreed_price_per_unit === 29, 'Final agreed price is ₹29/kg');
    assert(acceptData.data.total_amount === 13050, 'Final agreed total amount is ₹13,050');

    // Verify listing inventory was reduced from 1000 kg to 550 kg (1000 - 450 = 550)
    const checkListingRes = await fetch(`${BASE_URL}/produce/${listingId}`);
    const checkListingData = await checkListingRes.json();
    const remainingQty = Number(checkListingData.data.quantity);
    assert(remainingQty === 550, `Produce inventory reduced accurately: 1000kg - 450kg = ${remainingQty}kg`);

    // Verify terminal state block: further counter on accepted request is rejected
    const blockedCounterRes = await fetch(`${BASE_URL}/purchase-requests/${reqId}/counter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'buyer',
        quantity: 500,
        unit: 'kg',
        price_per_unit: 25
      })
    });
    assert(blockedCounterRes.status === 409, 'Modification of accepted request rejected with 409 Conflict');

    // -------------------------------------------------------------
    // TEST 6: Reject Deal Workflow
    // -------------------------------------------------------------
    console.log('\n--- Test 6: Reject Deal Workflow ---');
    const rejectTestReqRes = await fetch(`${BASE_URL}/purchase-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: listingId,
        requested_quantity: 100,
        unit: 'kg',
        offered_price_per_unit: 20
      })
    });
    const rejectTestReqData = await rejectTestReqRes.json();
    const rejectReqId = rejectTestReqData.data.id;

    const rejectRes = await fetch(`${BASE_URL}/purchase-requests/${rejectReqId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const rejectData = await rejectRes.json();
    assert(rejectRes.status === 200 && rejectData.data.status === 'rejected', 'Purchase request rejected successfully');

    // Countering rejected request should fail
    const blockedCounterOnRejected = await fetch(`${BASE_URL}/purchase-requests/${rejectReqId}/counter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'buyer', quantity: 100, price_per_unit: 25 })
    });
    assert(blockedCounterOnRejected.status === 409, 'Modification of rejected request rejected with 409 Conflict');

    // -------------------------------------------------------------
    // TEST 7: Cancel Request Workflow
    // -------------------------------------------------------------
    console.log('\n--- Test 7: Cancel Request Workflow ---');
    const cancelTestReqRes = await fetch(`${BASE_URL}/purchase-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: listingId,
        requested_quantity: 50,
        unit: 'kg',
        offered_price_per_unit: 25
      })
    });
    const cancelTestReqData = await cancelTestReqRes.json();
    const cancelReqId = cancelTestReqData.data.id;

    const cancelRes = await fetch(`${BASE_URL}/purchase-requests/${cancelReqId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const cancelData = await cancelRes.json();
    assert(cancelRes.status === 200 && cancelData.data.status === 'cancelled', 'Purchase request cancelled successfully');

    // -------------------------------------------------------------
    // TEST 8: Pagination & Filter API Endpoints
    // -------------------------------------------------------------
    console.log('\n--- Test 8: Filter & Pagination Endpoints ---');
    const filterRes = await fetch(`${BASE_URL}/purchase-requests?status=accepted&page=1&limit=5`);
    const filterData = await filterRes.json();
    assert(filterRes.status === 200 && filterData.success, 'Filtered GET /api/purchase-requests returns 200 OK');
    assert(Array.isArray(filterData.data), 'Returns array of requests');
    assert(filterData.pagination.page === 1, 'Pagination metadata is correct');

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n=============================================');
    console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('=============================================\n');

  } catch (error) {
    console.error('Test Suite Error:', error);
  }
}

runNegotiationTestSuite();
