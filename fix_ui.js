const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, 'app.js');
let appJs = fs.readFileSync(appJsPath, 'utf8');

const newCode = `
// ==========================================
// FIELDORA BACKEND INTEGRATION PATCH
// ==========================================

window.refreshProduceData = async function() {
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
};

window.renderFarmerHarvestLots = function() {
  const grid = document.querySelector('#f-view-produce .grid');
  if (!grid || !window.FIELDORA_DATA.produceItems) return;
  
  grid.innerHTML = window.FIELDORA_DATA.produceItems.map(item => \`
    <div class="ref-card overflow-hidden flex flex-col justify-between">
      <div>
        <img src="\${item.image}" alt="\${item.name}" class="w-full h-40 object-cover" />
        <div class="p-4 space-y-2">
          <div class="flex justify-between items-baseline">
            <h4 class="font-bold text-base text-deep-forest">\${item.name}</h4>
            <span class="font-mono font-bold text-deep-forest">₹\${item.price}/q</span>
          </div>
          <div class="text-xs text-secondary-text">\${item.qty} Quintals • Grade A • Harvest: \${item.harvestDate}</div>
          <span class="inline-block px-2.5 py-0.5 bg-[#dcfce7] text-[#166534] text-[10px] font-bold rounded-full">
            Active on Marketplace
          </span>
        </div>
      </div>
      <div class="p-4 pt-0">
        <button onclick="alert('Viewing live listing specs!')" class="w-full py-2 bg-[#F8FAF9] border border-[#E6ECE6] text-xs font-bold rounded-lg text-deep-forest hover:bg-emerald-50 transition-colors">
          View Live Details
        </button>
      </div>
    </div>
  \`).join('');
  
  // Also update the sidebar count
  const produceTab = document.getElementById('f-tab-produce');
  if (produceTab) {
    produceTab.innerHTML = \`<i data-lucide="leaf" class="w-5 h-5"></i> My Produce Lots (\${window.FIELDORA_DATA.produceItems.length})\`;
    lucide.createIcons();
  }
};

// OVERRIDE the inline handleFarmerListProduce function from index.html
window.handleFarmerListProduce = async function(e) {
  e.preventDefault();
  const crop = document.getElementById('fp-crop')?.value || 'Tomato';
  const variety = document.getElementById('fp-variety')?.value || 'Hybrid Grade A';
  const qty = document.getElementById('fp-qty')?.value || '50';
  const price = document.getElementById('fp-price')?.value || '2800';

  const onlineImage = crop.toLowerCase().includes('soya') || crop.toLowerCase().includes('soybean') 
    ? 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=800&q=80' 
    : 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80';

  const payload = {
    farmer_name: "Current Farmer",
    farm_name: "My Farm",
    is_farmer_verified: true,
    crop: crop,
    variety: variety,
    category: crop,
    quantity: parseInt(qty),
    unit: "quintal",
    expected_price: parseFloat(price),
    market_reference_price: parseFloat(price),
    location: "Nashik",
    quality: "Grade A+ Certified",
    harvest_date: new Date().toISOString().split('T')[0],
    delivery_option: "Direct Delivery",
    status: "Active",
    description: "Added via Fieldora UI",
    image_url: onlineImage,
    moisture_percentage: 9
  };

  try {
    const btn = e.target.querySelector('button[type="submit"]');
    const oldText = btn.innerHTML;
    btn.innerHTML = 'Publishing...';
    btn.disabled = true;

    await fetch('http://localhost:5000/api/produce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    // Refresh all data
    await window.refreshProduceData();
    window.renderFarmerHarvestLots();
    if (typeof renderMarketplace === 'function') renderMarketplace();
    
    btn.innerHTML = oldText;
    btn.disabled = false;
    
    showToast('Success', 'Produce Lot Published to Verified Marketplace!', 'success');
    showFarmerTab('farmer-produce');
  } catch (err) {
    console.error('Backend save failed:', err);
    alert('Failed to publish');
  }
};

// Run on load
setTimeout(async () => {
  await window.refreshProduceData();
  window.renderFarmerHarvestLots();
  if (typeof renderMarketplace === 'function') renderMarketplace();
}, 500);

`;

// Append to the end of app.js so it overrides
if (!appJs.includes('FIELDORA BACKEND INTEGRATION PATCH')) {
  fs.writeFileSync(appJsPath, appJs + '\\n' + newCode);
  console.log('Appended fix to app.js');
} else {
  console.log('Already patched');
}
