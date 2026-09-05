const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, 'app.js');
let appJs = fs.readFileSync(appJsPath, 'utf8');

// 1. Hook up DOMContentLoaded
const oldInit = `document.addEventListener('DOMContentLoaded', () => {
  initRouter();
  initTicker();
  initRoleState();
  initMarketplace();
  initCharts();
  initOrderSystem();
  initModalsAndDrawers();
  initForms();
  renderCartBadge();
});`;

const newInit = `document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('http://localhost:5000/api/produce');
    const data = await res.json();
    if (data && data.length > 0) {
      window.FIELDORA_DATA.produceItems = data.map(item => ({
        id: item.id,
        name: item.crop,
        category: item.category || 'Commodity',
        categoryKey: (item.category || 'Commodity').toLowerCase(),
        grade: item.quality || 'Standard',
        variety: item.variety || 'Standard',
        isElite: true,
        isOrganic: true,
        pricePerQtl: item.expected_price,
        minOrderQtl: 10,
        availableQtl: item.quantity,
        location: item.location || 'Unknown',
        farmName: item.farm_name || 'Partner Farm',
        farmerName: item.farmer_name || 'Verified Farmer',
        farmerRating: 4.8,
        farmerDeals: 5,
        moisture: item.moisture_percentage ? item.moisture_percentage + '%' : '10%',
        proteinContent: "12%",
        harvestDate: item.harvest_date || 'Recent',
        certifications: ["India Organic", "Fieldora QA"],
        image: item.image_url || "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80",
        stats: { qualityScore: 95, marketParity: "Fair" },
        verified: item.is_verified,
        price: item.expected_price,
        unit: item.unit || "quintal",
        qty: item.quantity,
        farmer: item.farmer_name || 'Verified Farmer'
      }));
    }
  } catch (err) {
    console.error('Failed to load from backend:', err);
  }

  initRouter();
  initTicker();
  initRoleState();
  initMarketplace();
  initCharts();
  initOrderSystem();
  initModalsAndDrawers();
  initForms();
  renderCartBadge();
});`;

appJs = appJs.replace(oldInit, newInit);

// 2. Hook up form submission
const oldSubmitStart = `      window.FIELDORA_DATA.produceItems.unshift({`;
const newSubmitStart = `      
        const onlineImage = name.toLowerCase().includes('soya') || name.toLowerCase().includes('soybean') 
          ? 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=800&q=80' 
          : 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80';

        const payload = {
          farmer_name: "Current Farmer",
          farm_name: "My Farm",
          is_farmer_verified: true,
          crop: name,
          variety: "Hybrid Standard",
          category: category,
          quantity: qty,
          unit: "quintal",
          expected_price: price,
          market_reference_price: price,
          location: location,
          quality: "Grade A+ Certified",
          harvest_date: new Date().toISOString().split('T')[0],
          delivery_option: "Direct Delivery",
          status: "Active",
          description: "Added via Fieldora UI",
          image_url: onlineImage,
          moisture_percentage: 9
        };

        fetch('http://localhost:5000/api/produce', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(res => res.json()).then(data => {
          console.log('Saved to backend:', data);
        }).catch(err => console.error('Backend save failed:', err));

        window.FIELDORA_DATA.produceItems.unshift({`;

appJs = appJs.replace(oldSubmitStart, newSubmitStart);

// Also modify the unshift payload to use the correct image
const oldImageProp = `image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80",`;
const newImageProp = `image: onlineImage,`;
appJs = appJs.replace(oldImageProp, newImageProp);

fs.writeFileSync(appJsPath, appJs);
console.log('Successfully patched app.js to use backend!');
