async function testDashboardAI() {
  const backendUrl = 'http://localhost:5000/api/ai/chat';

  const testPayload = {
    message: "What is on my dashboard and what is my total harvest valuation?",
    userRole: "farmer",
    userName: "Rajendra Patel",
    email: "rajendra@patelfarms.in",
    organization: "Patel Organic Farms • Nashik Farm Cluster",
    dashboardStats: {
      activeListingsCount: 4,
      buyerOffersCount: 2,
      activeOrdersCount: 1,
      totalValuation: "₹3,77,500"
    },
    listings: [
      { crop: "Onion", variety: "Nashik Garwa", qty: 50, unit: "Quintals", price: 2400, grade: "Grade A", status: "Active on Marketplace" },
      { crop: "Potato", variety: "Kufri Jyoti", qty: 45, unit: "Quintals", price: 2100, grade: "Grade A", status: "Active on Marketplace" },
      { crop: "Tomato", variety: "Abhinav Hybrid Grade A", qty: 35, unit: "Quintals", price: 2800, grade: "Grade A", status: "Under Negotiation" },
      { crop: "Capsicum", variety: "Green Blocky Hybrid", qty: 20, unit: "Quintals", price: 3200, grade: "Grade A", status: "Active on Marketplace" }
    ],
    offers: [
      { buyer_name: "Mumbai Fresh Mart", crop_name: "Tomato", requested_quantity: 50, unit: "Quintals", offered_price_per_unit: 2800, total_offer_amount: 140000, status: "pending" },
      { buyer_name: "FreshCart Wholesale", crop_name: "Tomato", requested_quantity: 50, unit: "Quintals", offered_price_per_unit: 2700, total_offer_amount: 135000, status: "pending" }
    ],
    orders: [
      { id: "TR-1042", order_number: "TR-1042", crop: "Onion (Nashik Garwa)", quantity: "8 Quintals", total_amount: 22800, status: "In Transit", payment_status: "Escrow Locked" }
    ]
  };

  console.log('Sending test query to AI...');
  try {
    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });

    const json = await res.json();
    console.log('\n--- AI RESPONSE ---');
    console.log(json.reply);
    console.log('\nModel Used:', json.model || (json.isFallback ? 'Direct Truthful Fallback' : 'Unknown'));
  } catch (err) {
    console.error('Test error:', err.message);
  }
}

testDashboardAI();
