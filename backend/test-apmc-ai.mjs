import app from './dist/app.js';
import http from 'http';

const server = http.createServer(app);

server.listen(5099, async () => {
  console.log('Test server running on port 5099...');

  try {
    // 1. Test GET /api/market-prices
    console.log('\n--- 1. Testing GET /api/market-prices ---');
    const res1 = await fetch('http://localhost:5099/api/market-prices');
    const json1 = await res1.json();
    console.log(`Success: ${json1.success}, Total commodities fetched: ${json1.count}`);
    console.log('Sample commodity from DB:', json1.data[0]?.crop, `(${json1.data[0]?.local_name}) - ₹${json1.data[0]?.average_price}/q`);

    // 2. Test POST /api/ai/chat for Tomato
    console.log('\n--- 2. Testing AI Chat for "What is the tomato price at Vashi APMC?" ---');
    const res2 = await fetch('http://localhost:5099/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What is the current tomato price at Vashi APMC?',
        userRole: 'farmer',
        userData: { name: 'Rajendra Patel', role: 'farmer', location: 'Nashik', listings: [{ crop: 'Tomato', quantity: '50 Quintals', price: '₹2800/q', status: 'Active' }] },
        marketData: [{ crop: 'Tomato', mandi: 'Vashi APMC', currentPrice: 2800, trend: 'up' }]
      })
    });
    const json2 = await res2.json();
    console.log('AI Reply:\n', json2.reply);

    // 3. Test POST /api/ai/chat for Marathi crop name "आले सातारा भाव काय आहे" (Ginger Satara)
    console.log('\n--- 3. Testing AI Chat for Marathi query "आले सातारा भाव" ---');
    const res3 = await fetch('http://localhost:5099/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'आले सातारा बाजारभाव सांगा',
        userRole: 'farmer',
        userData: { name: 'Rajendra Patel', role: 'farmer', location: 'Nashik', listings: [{ crop: 'Tomato', quantity: '50 Quintals', price: '₹2800/q', status: 'Active' }] },
        marketData: [{ crop: 'Tomato', mandi: 'Vashi APMC', currentPrice: 2800, trend: 'up' }]
      })
    });
    const json3 = await res3.json();
    console.log('AI Reply:\n', json3.reply);

    // 4. Test POST /api/ai/chat for Green Peas / वाटाणा
    console.log('\n--- 4. Testing AI Chat for "Green peas arrival and rate" ---');
    const res4 = await fetch('http://localhost:5099/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'How much is Green Peas rate and arrival in Mumbai APMC?',
        userRole: 'buyer',
        userData: { name: 'Sanjay Deshmukh', role: 'buyer', location: 'Mumbai', requirements: [{ crop: 'Tomato', quantity: '50 Quintals', targetPrice: '₹2800/q' }] },
        marketData: [{ crop: 'Tomato', mandi: 'Vashi APMC', currentPrice: 2800, trend: 'up' }]
      })
    });
    const json4 = await res4.json();
    console.log('AI Reply:\n', json4.reply);

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    server.close(() => {
      console.log('\nAll tests completed. Server stopped.');
      process.exit(0);
    });
  }
});
