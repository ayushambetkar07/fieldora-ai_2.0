/**
 * Test Suite: Dynamic Smart Direct Transport & Route Optimization Backend
 */
import { getDynamicTransportOptions, calculateMatchScore, SEED_TRANSPORT_VEHICLES, estimateTravelTime } from './dist/services/transportService.js';
import { calculateDistanceKm } from './dist/services/distanceService.js';

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

async function runTests() {
  console.log('================================================================');
  console.log('🚚 RUNNING TASK: DYNAMIC SMART DIRECT TRANSPORT TEST SUITE');
  console.log('================================================================\n');

  // --- Test 1: 800 kg Tomato Nashik -> Mumbai ---
  console.log('--- TEST 1: 800 kg Tomato Nashik -> Mumbai ---');
  const res1 = await getDynamicTransportOptions({
    pickupLocation: 'Nashik',
    destination: 'Mumbai',
    crop: 'Tomato',
    quantityKg: 800
  });

  assert(res1.pickupLocation === 'Nashik', 'Pickup location recorded as Nashik');
  assert(res1.destination === 'Mumbai', 'Destination recorded as Mumbai');
  assert(res1.requestedQuantityKg === 800, 'Requested payload normalized to 800 kg');
  assert(res1.distanceKm === 165, `Nashik -> Mumbai corridor distance is 165 km (Got: ${res1.distanceKm})`);
  assert(res1.suitableCount === 3, `3 vehicles suitable & available for 800 kg (Tata Ace 1000kg, Bolero 1500kg, Tata 407 2500kg) (Got: ${res1.suitableCount})`);
  
  // Mahindra Jeeto (700kg) must NOT be suitable
  const jeeto1 = res1.options.find(o => o.vehicleName.includes('Jeeto'));
  assert(jeeto1 && !jeeto1.isSuitable, 'Mahindra Jeeto (700 kg) marked isSuitable = false for 800 kg');
  assert(jeeto1 && jeeto1.matchScore === 0, 'Mahindra Jeeto receives matchScore = 0 when payload exceeds capacity');

  // Best Match for 800kg should be Tata Ace Gold (1000kg capacity, 80% optimal load)
  const bestMatch1 = res1.options.find(o => o.isBestMatch);
  assert(bestMatch1 && bestMatch1.vehicleName === 'Tata Ace Gold', `Tata Ace Gold is Best Match for 800 kg (Got: ${bestMatch1?.vehicleName})`);
  assert(bestMatch1.loadingPercentage === 80, `Tata Ace Gold loadingPercentage = 80% (Got: ${bestMatch1.loadingPercentage}%)`);
  assert(bestMatch1.matchScore > 85, `Tata Ace Gold has high match score: ${bestMatch1.matchScore}`);
  assert(bestMatch1.estimatedFreight > 0, `Estimated freight calculated: ₹${bestMatch1.estimatedFreight}`);

  // --- Test 2: 500 kg Onion Nashik -> Pune ---
  console.log('\n--- TEST 2: 500 kg Onion Nashik -> Pune ---');
  const res2 = await getDynamicTransportOptions({
    pickupLocation: 'Nashik',
    destination: 'Pune',
    crop: 'Onion',
    quantityKg: 500
  });

  assert(res2.distanceKm > 150, `Nashik -> Pune distance calculated: ${res2.distanceKm} km`);
  assert(res2.suitableCount === 4, `4 vehicles suitable & available for 500 kg (Mahindra Jeeto 700kg, Tata Ace 1000kg, Bolero 1500kg, Tata 407 2500kg) (Got: ${res2.suitableCount})`);

  // For 500 kg, Mahindra Jeeto (700kg, 71% load, lowest freight) or Tata Ace should be Best Match
  const bestMatch2 = res2.options.find(o => o.isBestMatch);
  assert(bestMatch2 && bestMatch2.isSuitable, `Best Match exists and is suitable (Got: ${bestMatch2?.vehicleName})`);
  assert(bestMatch2.vehicleName === 'Mahindra Jeeto' || bestMatch2.vehicleName === 'Tata Ace Gold', `Agile smaller vehicle selected as Best Match (Got: ${bestMatch2?.vehicleName})`);

  const jeeto2 = res2.options.find(o => o.vehicleName.includes('Jeeto'));
  assert(jeeto2 && jeeto2.isSuitable, 'Mahindra Jeeto marked isSuitable = true for 500 kg');
  assert(jeeto2.loadingPercentage === 71, `Mahindra Jeeto loadingPercentage = 71% (Got: ${jeeto2.loadingPercentage}%)`);

  // --- Test 3: 1200 kg Potato Nashik -> Mumbai ---
  console.log('\n--- TEST 3: 1200 kg Potato Nashik -> Mumbai ---');
  const res3 = await getDynamicTransportOptions({
    pickupLocation: 'Nashik',
    destination: 'Mumbai',
    crop: 'Potato',
    quantityKg: 1200
  });

  assert(res3.suitableCount === 2, `2 vehicles suitable & available for 1200 kg (Bolero 1500kg, Tata 407 2500kg) (Got: ${res3.suitableCount})`);
  
  const tataAce3 = res3.options.find(o => o.vehicleName === 'Tata Ace Gold');
  assert(tataAce3 && !tataAce3.isSuitable, 'Tata Ace Gold (1000kg) marked isSuitable = false for 1200 kg payload');

  const bestMatch3 = res3.options.find(o => o.isBestMatch);
  assert(bestMatch3 && bestMatch3.vehicleName === 'Bolero Maxi Truck', `Bolero Maxi Truck (1500kg) becomes Best Match for 1200 kg (Got: ${bestMatch3?.vehicleName})`);
  assert(bestMatch3.loadingPercentage === 80, `Bolero Maxi Truck loadingPercentage = 80% (Got: ${bestMatch3.loadingPercentage}%)`);

  // --- Test 4: Quantity Larger Than All Available Vehicles (e.g. 5000 kg) ---
  console.log('\n--- TEST 4: Quantity larger than all available vehicles (5000 kg) ---');
  const res4 = await getDynamicTransportOptions({
    pickupLocation: 'Nashik',
    destination: 'Mumbai',
    crop: 'Wheat',
    quantityKg: 5000
  });

  assert(res4.suitableCount === 0, `suitableCount is 0 for 5000 kg (Got: ${res4.suitableCount})`);
  const hasBestMatch4 = res4.options.some(o => o.isBestMatch);
  assert(!hasBestMatch4, 'No option is marked isBestMatch when no vehicle is suitable');
  res4.options.forEach(opt => {
    assert(!opt.isSuitable, `${opt.vehicleName} is marked isSuitable = false`);
    assert(opt.matchScore === 0, `${opt.vehicleName} matchScore is 0`);
  });

  // --- Test 5: Busy / Unavailable Vehicle Exclusion ---
  console.log('\n--- TEST 5: Busy / Unavailable Vehicle Handling ---');
  const ashokLeyland = res1.options.find(o => o.vehicleName.includes('Ashok Leyland'));
  assert(ashokLeyland && ashokLeyland.availabilityStatus === 'Busy', 'Ashok Leyland Dost has availabilityStatus = "Busy"');
  assert(ashokLeyland && !ashokLeyland.isBestMatch, 'Busy vehicle is NEVER selected as Best Match');

  // --- Test 6: Unit Conversion (Quintals & Tons) ---
  console.log('\n--- TEST 6: Unit Conversion Normalization ---');
  const resUnitQ = await getDynamicTransportOptions({
    pickupLocation: 'Nashik',
    destination: 'Mumbai',
    quantity: 8,
    unit: 'quintal'
  });
  assert(resUnitQ.requestedQuantityKg === 800, `8 quintals normalized to 800 kg (Got: ${resUnitQ.requestedQuantityKg} kg)`);

  const resUnitTon = await getDynamicTransportOptions({
    pickupLocation: 'Nashik',
    destination: 'Mumbai',
    quantity: 1.2,
    unit: 'ton'
  });
  assert(resUnitTon.requestedQuantityKg === 1200, `1.2 ton normalized to 1200 kg (Got: ${resUnitTon.requestedQuantityKg} kg)`);

  // --- Test 7: Deterministic Match Score Integrity (No Random Math) ---
  console.log('\n--- TEST 7: Deterministic Match Score Consistency ---');
  const scoreA = calculateMatchScore(SEED_TRANSPORT_VEHICLES[0], 800, 165, 2400);
  const scoreB = calculateMatchScore(SEED_TRANSPORT_VEHICLES[0], 800, 165, 2400);
  assert(scoreA.matchScore === scoreB.matchScore, `Deterministic calculation identical: ${scoreA.matchScore} === ${scoreB.matchScore}`);
  assert(scoreA.matchScore > 0 && scoreA.matchScore <= 100, `Match score bounded between 0-100 (Got: ${scoreA.matchScore})`);

  console.log('\n================================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test suite uncaught error:', err);
  process.exit(1);
});
