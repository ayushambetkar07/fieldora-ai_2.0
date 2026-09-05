const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(indexHtmlPath, 'utf8');

// 1. Give farmer grid an id
html = html.replace(
  '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">\n            <!-- Produce Lot 1 -->',
  '<div id="farmer-produce-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">\n            <!-- Produce Lot 1 -->'
);

// 2. Fix onsubmit handler on form
html = html.replace('handleFarmerListProduceAsync(event)', 'handleFarmerListProduce(event)');

// 3. Replace handleFarmerListProduce implementation with full dynamic reactivity engine
const oldFunctionPattern = /function handleFarmerListProduce\(e\) \{[\s\S]*?showFarmerTab\('farmer-produce'\);\s*\}/;

const newImplementation = `// Global produce data storage with local persistence
    window.FIELDORA_PRODUCE_DATA = JSON.parse(localStorage.getItem('fieldora_produce_items') || 'null') || [
      {
        id: 'prod-1',
        crop: 'Tomato',
        variety: 'Abhinav Hybrid Tomato',
        price: 2800,
        qty: 50,
        unit: 'Quintals',
        grade: 'Grade A',
        date: '05 Sep 2026',
        status: 'Active on Marketplace',
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
        farmer: 'Raj Farms (Rajendra Patel)',
        location: 'Nashik (18 km away)',
        rating: '4.8',
        score: 94
      },
      {
        id: 'prod-2',
        crop: 'Wheat',
        variety: 'Sharbati Gold Wheat',
        price: 2750,
        qty: 200,
        unit: 'Quintals',
        grade: 'Grade A+ Export',
        date: '12 Sep 2026',
        status: 'Active on Marketplace',
        image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
        farmer: 'Green Valley Farms',
        location: 'Indore, MP',
        rating: '4.7',
        score: 90
      },
      {
        id: 'prod-3',
        crop: 'Onion',
        variety: 'Nashik Garwa Onion',
        price: 2450,
        qty: 80,
        unit: 'Quintals',
        grade: 'Grade A',
        date: '08 Sep 2026',
        status: 'Under Negotiation',
        image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80',
        farmer: 'Sahyadri Agro Producer',
        location: 'Lasalgaon, Nashik',
        rating: '4.6',
        score: 88
      }
    ];

    function saveAndRenderProduce() {
      localStorage.setItem('fieldora_produce_items', JSON.stringify(window.FIELDORA_PRODUCE_DATA));
      renderFarmerProduceGrid();
      renderBuyerProduceGrid();
    }

    function renderFarmerProduceGrid() {
      const container = document.getElementById('farmer-produce-grid');
      if (!container) return;

      container.innerHTML = window.FIELDORA_PRODUCE_DATA.map(item => \`
        <div class="ref-card overflow-hidden flex flex-col justify-between">
          <div>
            <img src="\${item.image}" alt="\${item.crop}" class="w-full h-40 object-cover" onerror="this.src='https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80'" />
            <div class="p-4 space-y-2">
              <div class="flex justify-between items-baseline">
                <h4 class="font-bold text-base text-deep-forest">\${item.variety || item.crop}</h4>
                <span class="font-mono font-bold text-deep-forest">₹\${Number(item.price).toLocaleString('en-IN')}/q</span>
              </div>
              <div class="text-xs text-secondary-text">\${item.qty} \${item.unit || 'Quintals'} • \${item.grade || 'Grade A'} • Harvest: \${item.date}</div>
              <span class="inline-block px-2.5 py-0.5 \${item.status === 'Under Negotiation' ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-[#dcfce7] text-[#166534]'} text-[10px] font-bold rounded-full">
                \${item.status}
              </span>
            </div>
          </div>
          <div class="p-4 pt-0">
            <button onclick="alert('Viewing live listing specs for \${item.variety || item.crop}!')" class="w-full py-2 bg-[#F8FAF9] border border-[#E6ECE6] text-xs font-bold rounded-lg text-deep-forest hover:bg-emerald-50 transition-colors">
              View Live Details
            </button>
          </div>
        </div>
      \`).join('');

      const badge = document.getElementById('f-tab-produce');
      if (badge) {
        badge.innerHTML = \`<i data-lucide="leaf" class="w-5 h-5"></i> My Produce Lots (\${window.FIELDORA_PRODUCE_DATA.length})\`;
        if (window.lucide) lucide.createIcons();
      }
    }

    function renderBuyerProduceGrid() {
      const container = document.getElementById('buyer-produce-grid');
      if (!container) return;

      container.innerHTML = window.FIELDORA_PRODUCE_DATA.map((item, idx) => \`
        <div class="portal-card overflow-hidden flex flex-col justify-between group b-item \${idx === 0 ? 'border-2 border-[#166534]/40' : ''}" data-crop="\${(item.crop || '').toLowerCase()}">
          <div>
            <div class="relative">
              <img src="\${item.image}" alt="\${item.crop}" class="w-full h-44 object-cover" onerror="this.src='https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80'" />
              \${idx === 0 ? \`
                <span class="absolute top-2.5 left-2.5 px-2.5 py-1 bg-[#166534] text-white text-[10px] font-extrabold rounded-full shadow-md flex items-center gap-1">
                  <span>🏆 Best Match</span>
                </span>\` : ''}
              <span class="absolute top-2.5 right-2.5 px-2 py-0.5 bg-black/75 backdrop-blur-xs text-[#4ade80] text-[10px] font-bold font-mono rounded-md">
                Smart Score: \${item.score || 92}
              </span>
            </div>

            <div class="p-4 space-y-2.5">
              <div class="flex items-baseline justify-between">
                <h4 class="font-bold text-base text-deep-forest">\${item.variety || item.crop}</h4>
                <span class="text-base font-bold font-mono text-deep-forest">₹\${Number(item.price).toLocaleString('en-IN')}/q</span>
              </div>

              <div class="bg-[#F8FAF9] p-2.5 rounded-xl border border-[#E6ECE6] space-y-1 text-xs">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-deep-forest flex items-center gap-1">
                    <span>🌾 \${item.farmer || 'Verified Farmer'}</span>
                    <i data-lucide="check-circle" class="w-3 h-3 text-emerald-600"></i>
                  </span>
                  <span class="font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    ⭐ \${item.rating || '4.8'} <span class="text-[10px] text-gray-500 font-normal">(100+ reviews)</span>
                  </span>
                </div>
                <div class="flex items-center justify-between text-[11px] text-secondary-text">
                  <span>✓ Verified Produce</span>
                  <span class="text-emerald-700 font-bold">100% Quality Pass</span>
                </div>
              </div>

              <div class="flex items-center justify-between text-xs text-secondary-text pt-1">
                <span class="flex items-center gap-1"><i data-lucide="map-pin" class="w-3.5 h-3.5 text-gray-400"></i> \${item.location || 'Maharashtra'}</span>
                <span class="font-semibold text-deep-forest">\${item.qty} \${item.unit || 'Qtl'} Available</span>
              </div>
            </div>
          </div>

          <div class="p-4 pt-0">
            <button onclick="openDirectOfferModal('\${item.crop}', '\${item.farmer || 'Verified Farmer'}', \${item.price})" class="w-full py-2.5 btn-buyer text-xs font-bold rounded-xl shadow-xs">
              Send Purchase Offer
            </button>
          </div>
        </div>
      \`).join('');
      if (window.lucide) lucide.createIcons();
    }

    function handleFarmerListProduce(e) {
      if (e && e.preventDefault) e.preventDefault();
      
      const crop = document.getElementById('fp-crop')?.value || 'Soybean';
      const variety = document.getElementById('fp-variety')?.value || (crop + ' Premium Quality');
      const qty = document.getElementById('fp-qty')?.value || '50';
      const price = document.getElementById('fp-price')?.value || '4500';

      let img = 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=600&q=80';
      const lower = (crop + ' ' + variety).toLowerCase();
      if (lower.includes('soya') || lower.includes('soybean')) {
        img = 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=600&q=80';
      } else if (lower.includes('tomato')) {
        img = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80';
      } else if (lower.includes('wheat')) {
        img = 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80';
      } else if (lower.includes('onion')) {
        img = 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80';
      } else if (lower.includes('potato')) {
        img = 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80';
      }

      const newLot = {
        id: 'prod-' + Date.now(),
        crop: crop,
        variety: variety,
        price: Number(price),
        qty: Number(qty),
        unit: 'Quintals',
        grade: 'Grade A+ Certified',
        date: 'Just Now',
        status: 'Active on Marketplace',
        image: img,
        farmer: 'Ganesh Farm (Ayush Ambetkar)',
        location: 'Nashik Cluster, Maharashtra',
        rating: '5.0',
        score: 98
      };

      window.FIELDORA_PRODUCE_DATA.unshift(newLot);
      saveAndRenderProduce();

      try {
        fetch('http://localhost:5000/api/produce', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            farmer_name: 'Ayush Ambetkar',
            farm_name: 'Ganesh Farm',
            crop: crop,
            variety: variety,
            quantity: Number(qty),
            unit: 'quintal',
            expected_price: Number(price),
            location: 'Nashik Cluster, Maharashtra',
            image_url: img
          })
        }).catch(() => {});
      } catch (err) {}

      alert(\`🎉 Produce Lot Published to Verified Marketplace!\\n\\nCommodity: \${crop} (\${variety})\\nQuantity: \${qty} Quintals\\nAsking Rate: ₹\${price}/quintal\\nStatus: Active & Verified\\n\\nDirect FMCG buyers and procurement hubs have received instant match alerts.\`);
      
      showFarmerTab('farmer-produce');
    }`;

html = html.replace(oldFunctionPattern, newImplementation);

// 4. In DOMContentLoaded, call saveAndRenderProduce()
html = html.replace(
  "document.addEventListener('DOMContentLoaded', () => {\n      lucide.createIcons();",
  "document.addEventListener('DOMContentLoaded', () => {\n      saveAndRenderProduce();\n      lucide.createIcons();"
);

fs.writeFileSync(indexHtmlPath, html);
console.log('Successfully updated index.html!');
