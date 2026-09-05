/**
 * Fieldora Comprehensive Automated Test Suite for Buyer RFQ Tenders & Smart Matching Engine
 */

async function runTestSuite() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('🧪 Starting Fieldora RFQ & Smart Matching Engine Comprehensive Test Suite...\n');

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
    // SETUP: Seed test farmer produce listings
    // -------------------------------------------------------------
    console.log('--- Step 0: Seeding test farmer produce listings ---');
    
    // 1. Tomato Hybrid in Nashik (165 km from Mumbai) - 800 kg
    const farmerRes1 = await fetch(`${BASE_URL}/produce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farmer_name: 'Rajendra Patel (Nashik Farm)',
        farm_name: 'Patel Agro Farms',
        crop: 'Tomato',
        variety: 'Hybrid',
        quantity: 800,
        unit: 'kg',
        expected_price: 28,
        location: 'Nashik, Maharashtra',
        status: 'Active',
        is_verified: true
      })
    });
    const farmerData1 = await farmerRes1.json();
    assert(farmerRes1.status === 201 && farmerData1.success, 'Seeded Nashik Tomato Hybrid listing');
    const seededNashikTomatoId = farmerData1.data.id;

    // 2. Tomato Cherry in Pune (150 km from Mumbai) - 500 kg
    const farmerRes2 = await fetch(`${BASE_URL}/produce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farmer_name: 'Pune Organic Producer',
        farm_name: 'Pune Farms',
        crop: 'Tomato',
        variety: 'Cherry',
        quantity: 500,
        unit: 'kg',
        expected_price: 35,
        location: 'Pune, Maharashtra',
        status: 'Active',
        is_verified: true
      })
    });
    const farmerData2 = await farmerRes2.json();
    assert(farmerRes2.status === 201 && farmerData2.success, 'Seeded Pune Tomato Cherry listing');

    // 3. Onion Red in Lasalgaon (Unrelated crop) - 1000 kg
    const farmerRes3 = await fetch(`${BASE_URL}/produce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farmer_name: 'Lasalgaon Onion Mandi Group',
        farm_name: 'Nashik Onion Co',
        crop: 'Onion',
        variety: 'Red',
        quantity: 1000,
        unit: 'kg',
        expected_price: 22,
        location: 'Lasalgaon, Maharashtra',
        status: 'Active',
        is_verified: true
      })
    });
    const farmerData3 = await farmerRes3.json();
    assert(farmerRes3.status === 201 && farmerData3.success, 'Seeded Lasalgaon Onion listing');

    // -------------------------------------------------------------
    // TEST 1: Validation rejection tests
    // -------------------------------------------------------------
    console.log('\n--- Test 1: Input Validation Rejections ---');
    
    // Negative quantity
    const negQtyRes = await fetch(`${BASE_URL}/buyer-requirements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        crop_name: 'Tomato',
        required_quantity: -100,
        unit: 'kg',
        delivery_location: 'Mumbai'
      })
    });
    assert(negQtyRes.status === 400, 'Rejects negative required_quantity with 400 Bad Request');

    // Zero quantity
    const zeroQtyRes = await fetch(`${BASE_URL}/buyer-requirements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        crop_name: 'Tomato',
        required_quantity: 0,
        unit: 'kg',
        delivery_location: 'Mumbai'
      })
    });
    assert(zeroQtyRes.status === 400, 'Rejects zero required_quantity with 400 Bad Request');

    // Empty crop name
    const emptyCropRes = await fetch(`${BASE_URL}/buyer-requirements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        crop_name: '   ',
        required_quantity: 500,
        unit: 'kg',
        delivery_location: 'Mumbai'
      })
    });
    assert(emptyCropRes.status === 400, 'Rejects empty crop_name with 400 Bad Request');

    // Invalid unit
    const badUnitRes = await fetch(`${BASE_URL}/buyer-requirements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        crop_name: 'Tomato',
        required_quantity: 500,
        unit: 'liters_invalid',
        delivery_location: 'Mumbai'
      })
    });
    assert(badUnitRes.status === 400, 'Rejects unsupported unit with 400 Bad Request');

    // -------------------------------------------------------------
    // TEST 2: Valid RFQ Creation
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Valid RFQ Creation ---');
    const createRfqRes = await fetch(`${BASE_URL}/buyer-requirements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        crop_name: 'Tomato',
        variety: 'Hybrid',
        required_quantity: 1000,
        unit: 'kg',
        target_price: 32,
        delivery_location: 'Mumbai, Maharashtra',
        required_by_date: '2026-09-20',
        description: 'Need fresh Grade A tomatoes for retail distribution'
      })
    });
    const rfqData = await createRfqRes.json();
    assert(createRfqRes.status === 201 && rfqData.success, 'Valid RFQ created with 201 Created');
    assert(rfqData.data.status === 'open', 'New RFQ default status is "open"');
    const rfqId = rfqData.data.id;

    // -------------------------------------------------------------
    // TEST 3: Smart Match Calculation & Deterministic Scoring
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Smart Match Calculation & Explainability ---');
    const matchRes = await fetch(`${BASE_URL}/buyer-requirements/${rfqId}/matches`);
    const matchData = await matchRes.json();
    assert(matchRes.status === 200 && matchData.success, 'Matches endpoint returns 200 OK');
    assert(Array.isArray(matchData.matches), 'Returned matches array');

    // Verify Onion was excluded (crop_score = 0)
    const onionMatch = matchData.matches.find(m => m.crop && m.crop.toLowerCase().includes('onion'));
    assert(!onionMatch, 'Unrelated crop (Onion) is excluded from Tomato RFQ matches');

    // Verify Tomato Hybrid Match breakdown
    const nashikMatch = matchData.matches.find(m => m.listing_id === seededNashikTomatoId);
    assert(!!nashikMatch, 'Seeded Nashik farmer listing is identified as candidate');

    if (nashikMatch) {
      console.log('    Nashik Tomato Hybrid Match Breakdown:', JSON.stringify(nashikMatch.scores, null, 2));
      assert(nashikMatch.scores.crop === 100, 'Crop match score is 100% (Exact match)');
      assert(nashikMatch.scores.variety === 100, 'Variety match score is 100% (Hybrid === Hybrid)');
      assert(nashikMatch.scores.quantity === 80, 'Quantity match score is 80% (800kg / 1000kg)');
      assert(nashikMatch.scores.distance === 60, 'Distance score is 60% (161km tier)');
      // Formula: 100*0.30 + 100*0.20 + 80*0.25 + 60*0.25 = 30 + 20 + 20 + 15 = 85%
      assert(nashikMatch.match_percentage === 85, `Deterministic match percentage: ${nashikMatch.match_percentage}% === 85%`);
    }

    // Verify Tomato Cherry (Variety Mismatch: Variety score = 0)
    const cherryMatch = matchData.matches.find(m => m.variety && m.variety.toLowerCase().includes('cherry'));
    if (cherryMatch) {
      console.log('    Cherry Tomato Match Breakdown:', JSON.stringify(cherryMatch.scores, null, 2));
      assert(cherryMatch.scores.crop === 100, 'Cherry Tomato crop match is 100%');
      assert(cherryMatch.scores.variety === 0, 'Variety mismatch (Cherry vs Hybrid) gives variety score 0%');
    }

    // Verify sorting by match_percentage DESC
    let isSortedDesc = true;
    for (let i = 0; i < matchData.matches.length - 1; i++) {
      if (matchData.matches[i].match_percentage < matchData.matches[i + 1].match_percentage) {
        isSortedDesc = false;
        break;
      }
    }
    assert(isSortedDesc, 'Matches are correctly sorted by match_percentage in descending order');

    // -------------------------------------------------------------
    // TEST 4: Pagination & Filtering
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Pagination & Filtering ---');
    const pagedRes = await fetch(`${BASE_URL}/buyer-requirements?page=1&limit=2`);
    const pagedData = await pagedRes.json();
    assert(pagedRes.status === 200 && pagedData.success, 'Paginated GET /api/buyer-requirements returns 200 OK');
    assert(pagedData.pagination.page === 1, 'Pagination page number is 1');
    assert(pagedData.pagination.limit === 2, 'Pagination limit is 2');
    assert(pagedData.data.length <= 2, 'Returned records adhere to limit');

    // -------------------------------------------------------------
    // TEST 5: Live Demand Alerts & Persistence
    // -------------------------------------------------------------
    console.log('\n--- Test 5: Live Demand Alerts ---');
    const alertsRes = await fetch(`${BASE_URL}/demand-alerts`);
    const alertsData = await alertsRes.json();
    assert(alertsRes.status === 200 && alertsData.success, 'Demand alerts endpoint returns 200 OK');
    assert(alertsData.data.length > 0, 'Generated demand alerts for qualifying farmers (>= 60%)');

    const recentAlert = alertsData.data.find(a => a.requirement_id === rfqId);
    assert(!!recentAlert, 'Demand alert linked to created RFQ exists in database');
    assert(recentAlert && recentAlert.read === false, 'New demand alert has read = false');

    if (recentAlert) {
      // Mark as read
      const readRes = await fetch(`${BASE_URL}/demand-alerts/${recentAlert.id}/read`, {
        method: 'PATCH'
      });
      const readData = await readRes.json();
      assert(readRes.status === 200 && readData.data.read === true, 'Marked demand alert as read');
    }

    // -------------------------------------------------------------
    // TEST 6: Status Lifecycle & Transitions
    // -------------------------------------------------------------
    console.log('\n--- Test 6: Status Lifecycle & Updates ---');
    // Update status to closed
    const closeRes = await fetch(`${BASE_URL}/buyer-requirements/${rfqId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'closed' })
    });
    const closeData = await closeRes.json();
    assert(closeRes.status === 200 && closeData.data.status === 'closed', 'RFQ status transitioned to "closed"');

    // Attempting edit on closed RFQ should fail
    const blockedEditRes = await fetch(`${BASE_URL}/buyer-requirements/${rfqId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ required_quantity: 2000 })
    });
    assert(blockedEditRes.status === 409, 'Modification of closed RFQ rejected with 409 Conflict');

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

runTestSuite();
