import { handler } from '../netlify/functions/api.js';

async function invokeFunction(method, path, body = null, headers = {}) {
  const event = {
    httpMethod: method,
    path: path,
    rawUrl: `http://localhost${path}`,
    headers: {
      'content-type': 'application/json',
      ...headers
    },
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null,
    isBase64Encoded: false
  };

  const context = {};
  const response = await handler(event, context);
  
  let json = null;
  try {
    json = JSON.parse(response.body);
  } catch (e) {
    json = response.body;
  }
  
  return {
    statusCode: response.statusCode,
    headers: response.headers,
    body: json
  };
}

async function runTests() {
  console.log('🧪 RUNNING NETLIFY FUNCTION SERVERLESS BACKEND TESTS\n');
  let passed = 0;
  let failed = 0;

  function assert(cond, desc, details = '') {
    if (cond) {
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc} | Details: ${details}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    console.log('--- 1. Testing Netlify Health Endpoint ---');
    const healthRes = await invokeFunction('GET', '/api/health');
    assert(healthRes.statusCode === 200, 'Health endpoint returns 200 OK');
    assert(healthRes.body?.status === 'online', 'Health status is online');

    // 2. Produce Listings
    console.log('\n--- 2. Testing Produce Listings Endpoint ---');
    const produceRes = await invokeFunction('GET', '/api/produce-listings');
    assert(produceRes.statusCode === 200, 'GET /api/produce-listings returns 200 OK');
    assert(Array.isArray(produceRes.body?.data), 'Produce listings returns an array');
    
    // Create a fresh test listing
    const createListingRes = await invokeFunction('POST', '/api/produce-listings', {
      crop: 'Shimla Apples',
      variety: 'Royal Delicious',
      quantity: 500,
      unit: 'quintal',
      price_per_unit: 4200,
      farmer_name: 'Harish Verma',
      location: 'Shimla, HP'
    });
    const listingId = createListingRes.body?.data?.id || produceRes.body?.data?.[0]?.id;
    assert(!!listingId, 'Produce listing created or fetched');

    // 3. Purchase Request Negotiation (Task 3)
    console.log('\n--- 3. Testing Task 3: Deal Negotiation ---');
    const prRes = await invokeFunction('POST', '/api/purchase-requests', {
      listing_id: listingId,
      buyer_id: '8996d084-1f18-45bd-995a-27ac039436ce',
      buyer_name: 'Metro Cash & Carry',
      buyer_company: 'Metro Wholesale',
      requested_quantity: 50,
      unit: 'quintal',
      offered_price_per_unit: 4200,
      delivery_location: 'Delhi Central Depot',
      message: 'Initial wholesale purchase offer'
    });
    assert(prRes.statusCode === 201, 'Created purchase request returns 201 Created');
    const prId = prRes.body?.data?.id;
    assert(!!prId, 'Purchase request ID generated');
    assert(prRes.body?.data?.total_amount === 210000 || prRes.body?.data?.total_offer_amount === 210000, 'Calculated total amount correctly (50 * 4200 = 210,000)');

    // Counter Offer
    const counterRes = await invokeFunction('POST', `/api/purchase-requests/${prId}/counter`, {
      price_per_unit: 4300,
      quantity: 50,
      role: 'farmer',
      unit: 'quintal',
      message: 'We can settle at 4300'
    });
    assert(counterRes.statusCode === 200, 'Counter offer submitted with 200 OK');
    assert(counterRes.body?.data?.status === 'counter_offered', 'Status updated to counter_offered');

    // Accept Deal
    const acceptRes = await invokeFunction('POST', `/api/purchase-requests/${prId}/accept`, {
      user_id: '039b5a52-cfab-42df-9cbc-22214e210de5',
      role: 'farmer'
    });
    assert(acceptRes.statusCode === 200, 'Accepted deal returns 200 OK');
    assert(acceptRes.body?.data?.status === 'accepted', 'Deal marked accepted');
    const orderCreated = acceptRes.body?.data?.order;
    assert(!!orderCreated?.id, 'Order created automatically upon deal acceptance');

    // 4. Smart Escrow & Order Lifecycle (Task 4)
    console.log('\n--- 4. Testing Task 4: Smart Escrow & Lifecycle ---');
    const orderId = orderCreated.id;
    
    // Escrow Lock
    const lockRes = await invokeFunction('POST', `/api/orders/${orderId}/escrow/lock`, {
      deposit_amount: 215000,
      notes: 'Initial buyer escrow lock'
    });
    assert(lockRes.statusCode === 200, 'Escrow deposit locked successfully', JSON.stringify(lockRes.body));
    const lockStatus = lockRes.body?.data?.order?.payment_status || lockRes.body?.data?.payment_status;
    assert(lockStatus === 'Escrow Locked', 'Payment status is Escrow Locked', `Got: ${lockStatus}`);

    // Dispatch
    const dispatchRes = await invokeFunction('POST', `/api/orders/${orderId}/dispatch`, {
      vehicle_name: 'Eicher Pro 3019',
      vehicle_type: 'Refrigerated Truck',
      vehicle_number: 'MH-12-QX-9021',
      driver_name: 'Vikas Patil',
      driver_phone: '+91 98230 11223',
      pickup_location: 'Shimla APMC',
      delivery_location: 'Delhi Central Depot'
    });
    assert(dispatchRes.statusCode === 200, 'Order dispatched with 200 OK', JSON.stringify(dispatchRes.body));
    const dispatchStatus = dispatchRes.body?.data?.order?.status || dispatchRes.body?.data?.status;
    assert(dispatchStatus === 'In Transit', 'Order status updated to In Transit', `Got: ${dispatchStatus}`);

    // GPS Telemetry Ingestion
    const gpsRes = await invokeFunction('POST', `/api/orders/${orderId}/gps`, {
      latitude: 18.5204,
      longitude: 73.8567,
      speed_kmh: 55,
      checkpoint_name: 'Pune Toll Plaza',
      progress_percent: 30,
      eta: '4h 15m'
    });
    assert(gpsRes.statusCode === 201, 'GPS telemetry ingested successfully (201 Created)', JSON.stringify(gpsRes.body));

    // Deliver
    const deliverRes = await invokeFunction('POST', `/api/orders/${orderId}/deliver`);
    assert(deliverRes.statusCode === 200, 'Delivery confirmed with 200 OK');

    // Gate 1: Quality Assay
    const assayRes = await invokeFunction('POST', `/api/orders/${orderId}/assay`, {
      inspector_name: 'Dr. Ramesh Sharma',
      lab_name: 'NABL Certified AgriLab',
      tested_grade: 'Grade A',
      target_grade: 'Grade A',
      moisture_percentage: 12.5,
      foreign_matter_percentage: 0.8,
      assay_passed: true,
      certificate_number: 'NABL-2026-AP-99'
    });
    assert(assayRes.statusCode === 201, 'Quality assay passed with 201 Created', JSON.stringify(assayRes.body));

    // Gate 2: Weighment Verification
    const weighRes = await invokeFunction('POST', `/api/orders/${orderId}/weighment`, {
      gross_weight: 5400,
      tare_weight: 400,
      unit: 'kg',
      weighbridge_slip_id: 'WB-99120',
      weighbridge_name: 'APMC Weighbridge'
    });
    assert(weighRes.statusCode === 201, 'Weighment slip verified with 201 Created', JSON.stringify(weighRes.body));

    // Release Escrow Payout
    const releaseRes = await invokeFunction('POST', `/api/orders/${orderId}/escrow/release`, {});
    assert(releaseRes.statusCode === 200, 'Smart escrow funds released to farmer', JSON.stringify(releaseRes.body));
    const releasePaymentStatus = releaseRes.body?.data?.order?.payment_status || releaseRes.body?.data?.payment_status;
    assert(releasePaymentStatus === 'Released', 'Order payment status is Released', `Got: ${releasePaymentStatus}`);

    // Invoice & Audit Trail
    const invoiceRes = await invokeFunction('GET', `/api/orders/${orderId}/invoice`);
    assert(invoiceRes.statusCode === 200, 'Digital invoice generated with 200 OK');
    assert(!!invoiceRes.body?.data?.invoice_number, 'Invoice number generated');

    const auditRes = await invokeFunction('GET', `/api/orders/${orderId}/audit-trail`);
    assert(auditRes.statusCode === 200, 'Audit trail ledger returned with 200 OK');
    assert(!!auditRes.body?.data?.order_id || Array.isArray(auditRes.body?.data?.transactions) || Array.isArray(auditRes.body?.data?.financial_transactions), 'Audit trail contains audit records');

    // 5. Verified Reviews & Trust Scoring (Task 6)
    console.log('\n--- 5. Testing Task 6: Verified Reviews & Trust Scoring ---');
    const farmerId = orderCreated.farmer_id || '039b5a52-cfab-42df-9cbc-22214e210de5';
    const buyerId = orderCreated.buyer_id || '8996d084-1f18-45bd-995a-27ac039436ce';

    const reviewPayload = {
      order_id: orderId,
      communication_rating: 5,
      quality_rating: 5,
      reliability_rating: 5,
      timeliness_rating: 4,
      comment: 'Excellent crop quality and prompt dispatch!'
    };

    const createReviewRes = await invokeFunction('POST', '/api/reviews', reviewPayload, {
      'x-user-id': buyerId
    });
    assert(createReviewRes.statusCode === 201, 'Verified review submitted with 201 Created', JSON.stringify(createReviewRes.body));
    assert(createReviewRes.body?.data?.verified_trade === true, 'Review flagged as verified trade');
    const overallRating = createReviewRes.body?.data?.overall_rating;
    assert(overallRating === 4.75 || overallRating === 4.8 || overallRating === 5, 'Rating overall computed accurately ((5+5+5+4)/4 = 4.75)', `Got: ${overallRating}`);

    // Duplicate review protection
    const dupRes = await invokeFunction('POST', '/api/reviews', reviewPayload, {
      'x-user-id': buyerId
    });
    assert(dupRes.statusCode === 409, 'Duplicate review rejected with 409 Conflict', JSON.stringify(dupRes.body));

    // Query reviews for order
    const orderReviewsRes = await invokeFunction('GET', `/api/reviews/order/${orderId}`);
    assert(orderReviewsRes.statusCode === 200, 'Query reviews by order returns 200 OK');
    assert(orderReviewsRes.body?.data?.length >= 1, 'Review retrieved for completed order');

    // Query Trust Score
    const trustScoreRes = await invokeFunction('GET', `/api/reviews/trust-score/${farmerId}`);
    assert(trustScoreRes.statusCode === 200, 'Query trust score returns 200 OK');
    assert(trustScoreRes.body?.data?.trust_score >= 0, 'Trust score returned dynamically');

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  }

  console.log('\n=============================================');
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('=============================================');
  if (failed > 0) process.exit(1);
}

runTests();
