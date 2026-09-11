async function testBuyerAI() {
  const backendUrl = 'http://localhost:5000/api/ai/chat';

  const buyerPayload = {
    message: "What is on my dashboard and what is my procurement status?",
    userRole: "buyer",
    userName: "FreshMart Supermarkets Ltd",
    organization: "FreshMart Supermarkets Ltd • Mumbai Corporate Procurement Hub",
    dashboardStats: {
      activeRequirementsCount: 3,
      pendingOrdersCount: 2,
      totalPurchasesCount: 18,
      amountSpent: "₹24.8 Lakhs",
      activeRfqsCount: 3,
      buyerOffersCount: 2
    },
    requirements: [
      { crop: "Tomato", required_quantity: 100, unit: "Quintals", target_price: 2800, delivery_location: "Mumbai Hub" },
      { crop: "Wheat", required_quantity: 200, unit: "Quintals", target_price: 2750, delivery_location: "Mumbai Hub" },
      { crop: "Onion", required_quantity: 150, unit: "Quintals", target_price: 2400, delivery_location: "Mumbai Hub" }
    ],
    offers: [
      { farmer_name: "Rajendra Patel", crop_name: "Tomato", requested_quantity: 50, unit: "Quintals", offered_price_per_unit: 2800, total_offer_amount: 140000, status: "pending" }
    ],
    orders: [
      { id: "TR-1042", order_number: "TR-1042", crop: "Onion (Nashik Garwa)", quantity: "8 Quintals", total_amount: 22800, status: "In Transit", payment_status: "Escrow Secured" },
      { id: "TR-1043", order_number: "TR-1043", crop: "Tomato (Abhinav Hybrid)", quantity: "50 Quintals", total_amount: 140000, status: "In Transit", payment_status: "Escrow Secured" }
    ]
  };

  console.log('Sending Buyer test query to AI...');
  try {
    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buyerPayload)
    });

    const json = await res.json();
    console.log('\n--- BUYER AI RESPONSE ---');
    console.log(json.reply);
    console.log('\nModel Used:', json.model || (json.isFallback ? 'Direct Truthful Fallback' : 'Groq / LLM'));
  } catch (err) {
    console.error('Test error:', err.message);
  }
}

testBuyerAI();
