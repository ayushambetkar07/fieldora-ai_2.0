const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(indexHtmlPath, 'utf8');

// 1. Give container IDs
html = html.replace(
  '<div id="b-view-requirements" class="hidden space-y-6">\n          <div class="flex items-center justify-between">\n            <div>\n              <h2 class="text-2xl font-heading font-extrabold text-deep-forest">My Published Procurement RFQs</h2>\n              <p class="text-xs text-secondary-text">Active commodity target tenders broadcasted to verified regional producers.</p>\n            </div>\n            <button onclick="showBuyerTab(\'buyer-rfq-form\')" class="px-4 py-2 btn-buyer text-xs font-bold rounded-xl shadow-button flex items-center gap-1">\n              <i data-lucide="plus" class="w-4 h-4"></i> + Post New RFQ\n            </button>\n          </div>\n\n          <div class="space-y-4">',
  '<div id="b-view-requirements" class="hidden space-y-6">\n          <div class="flex items-center justify-between">\n            <div>\n              <h2 class="text-2xl font-heading font-extrabold text-deep-forest">My Published Procurement RFQs</h2>\n              <p class="text-xs text-secondary-text">Active commodity target tenders broadcasted to verified regional producers.</p>\n            </div>\n            <button onclick="showBuyerTab(\'buyer-rfq-form\')" class="px-4 py-2 btn-buyer text-xs font-bold rounded-xl shadow-button flex items-center gap-1">\n              <i data-lucide="plus" class="w-4 h-4"></i> + Post New RFQ\n            </button>\n          </div>\n\n          <div id="buyer-rfqs-list" class="space-y-4">'
);

html = html.replace(
  '<div id="f-view-requirements" class="hidden space-y-6">\n          <div>\n            <h2 class="text-2xl font-heading font-extrabold text-deep-forest">Verified Buyer Procurement Demands</h2>\n            <p class="text-xs text-secondary-text">Scored automatically against your farm harvest and transit proximity.</p>\n          </div>\n\n          <div class="space-y-4">',
  '<div id="f-view-requirements" class="hidden space-y-6">\n          <div>\n            <h2 class="text-2xl font-heading font-extrabold text-deep-forest">Verified Buyer Procurement Demands</h2>\n            <p class="text-xs text-secondary-text">Scored automatically against your farm harvest and transit proximity.</p>\n          </div>\n\n          <div id="farmer-demands-list" class="space-y-4">'
);

// 2. Add RFQ state & renderer logic into script section
const rfqEngineCode = `
    // =========================================================================
    // DYNAMIC RFQ & BUYER DEMAND SYNCHRONIZATION ENGINE
    // =========================================================================
    window.FIELDORA_RFQ_DATA = JSON.parse(localStorage.getItem('fieldora_rfq_items') || 'null') || [
      {
        id: 'rfq-1',
        buyer: 'FreshMart Supermarkets',
        buyerType: 'Verified Corporate',
        crop: 'Tomato',
        variety: 'Hybrid Red Table',
        qty: 50,
        price: 2800,
        dest: 'Mumbai Central Distribution Hub',
        date: '08 Sep 2026',
        bids: 4,
        match: 94
      },
      {
        id: 'rfq-2',
        buyer: 'AgroPure Foods Ltd',
        buyerType: 'Verified Processor',
        crop: 'Wheat',
        variety: 'Sharbati Gold Wheat',
        qty: 150,
        price: 2750,
        dest: 'Indore Processing Hub',
        date: '15 Sep 2026',
        bids: 2,
        match: 91
      }
    ];

    function saveAndRenderRfqs() {
      localStorage.setItem('fieldora_rfq_items', JSON.stringify(window.FIELDORA_RFQ_DATA));
      renderBuyerRfqs();
      renderFarmerDemands();
    }

    function renderBuyerRfqs() {
      const container = document.getElementById('buyer-rfqs-list');
      if (!container) return;

      container.innerHTML = window.FIELDORA_RFQ_DATA.map(rfq => \`
        <div class="ref-card p-6 space-y-3">
          <div class="flex items-start justify-between flex-wrap gap-2">
            <div>
              <h3 class="font-bold text-base text-deep-forest">\${rfq.crop} (\${rfq.variety || 'Standard Spec'})</h3>
              <p class="text-xs text-secondary-text">Volume: <strong>\${rfq.qty} Quintals</strong> • Target Rate: <strong class="font-mono text-deep-forest">₹\${Number(rfq.price).toLocaleString('en-IN')}/q</strong></p>
              <p class="text-[11px] text-gray-500 mt-0.5">Destination: \${rfq.dest || 'Regional Hub'} • Required by \${rfq.date || 'Immediate'}</p>
            </div>
            <span class="px-3 py-1 bg-[#dcfce7] text-[#166534] text-xs font-bold rounded-full">
              Active (\${rfq.bids || 0} FPO Bids)
            </span>
          </div>
          <div class="flex items-center justify-between pt-2 border-t border-[#E6ECE6] text-xs flex-wrap gap-2">
            <span class="text-secondary-text">Terms: 100% Escrow deposit locked</span>
            <button onclick="alert('Viewing bids for \${rfq.crop} RFQ!')" class="text-deep-forest font-bold hover:underline">
              View Producer Bids (\${rfq.bids || 0}) →
            </button>
          </div>
        </div>
      \`).join('');
    }

    function renderFarmerDemands() {
      const container = document.getElementById('farmer-demands-list');
      if (!container) return;

      container.innerHTML = window.FIELDORA_RFQ_DATA.map(rfq => \`
        <div class="ref-card p-6 space-y-3">
          <div class="flex items-start justify-between flex-wrap gap-2">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-bold text-base text-deep-forest">\${rfq.buyer || 'Enterprise Buyer'}</h3>
                <span class="px-2.5 py-0.5 bg-[#dcfce7] text-[#166534] text-[10px] font-bold rounded-full">\${rfq.buyerType || 'Verified Buyer'}</span>
              </div>
              <p class="text-xs text-secondary-text">Required: \${rfq.qty} Quintals \${rfq.crop} • Destination: \${rfq.dest || 'Distribution Center'} • Target Rate: ₹\${Number(rfq.price).toLocaleString('en-IN')}/q</p>
            </div>
            <span class="px-3 py-1 bg-deep-forest text-white font-mono font-bold text-xs rounded-full">
              \${rfq.match || 92}% Match
            </span>
          </div>

          <div class="w-full bg-[#dcfce7] h-2 rounded-full overflow-hidden">
            <div class="bg-deep-forest h-full rounded-full" style="width: \${rfq.match || 92}%"></div>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-[#E6ECE6] text-xs flex-wrap gap-2">
            <span class="text-secondary-text">Payment: <strong>100% Escrow deposit locked</strong></span>
            <button onclick="alert('Offer transmitted directly to \${rfq.buyer || 'Buyer Procurement'}!')" class="px-4 py-2 btn-farmer text-xs font-bold rounded-xl shadow-xs">
              Respond with Lot Availability
            </button>
          </div>
        </div>
      \`).join('');
    }

    function handleBuyerPostRfq(e) {
      if (e && e.preventDefault) e.preventDefault();
      const crop = document.getElementById('brfq-crop')?.value || 'Soybean';
      const variety = document.getElementById('brfq-variety')?.value || 'Grade A Table Spec';
      const qty = document.getElementById('brfq-qty')?.value || '100';
      const price = document.getElementById('brfq-price')?.value || '4500';
      const loc = document.getElementById('brfq-loc')?.value || 'FreshMart Central Distribution Hub, Bhiwandi';

      const newRfq = {
        id: 'rfq-' + Date.now(),
        buyer: 'FreshMart Agro Procure',
        buyerType: 'Verified Corporate',
        crop: crop,
        variety: variety,
        qty: Number(qty),
        price: Number(price),
        dest: loc,
        date: '20 Sep 2026',
        bids: 0,
        match: 96
      };

      window.FIELDORA_RFQ_DATA.unshift(newRfq);
      saveAndRenderRfqs();

      try {
        fetch('http://localhost:5000/api/requirements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            crop_name: crop,
            quantity: Number(qty),
            unit: 'quintal',
            target_price: Number(price),
            delivery_location: loc
          })
        }).catch(() => {});
      } catch (err) {}

      alert(\`🎉 RFQ Tender Broadcasted Successfully!\\n\\nVolume: \${qty} Quintals \${crop} (\${variety})\\nTarget Rate: ₹\${price}/q\\nDestination: \${loc}\\n\\n📈 Demand Intelligence Match: 12,400+ Verified Regional FPOs & matching farmers notified!\`);
      showBuyerTab('buyer-requirements');
    }

    function handleRfqSubmit(e) {
      if (e && e.preventDefault) e.preventDefault();
      const crop = document.getElementById('rfq-crop')?.value || 'Wheat';
      const qty = document.getElementById('rfq-qty')?.value || '100';
      const price = document.getElementById('rfq-price')?.value || '2500';
      const loc = document.getElementById('rfq-loc')?.value || 'Vashi Hub';
      
      const newRfq = {
        id: 'rfq-' + Date.now(),
        buyer: 'Enterprise Buyer Hub',
        buyerType: 'Verified Enterprise',
        crop: crop,
        variety: crop + ' Standard',
        qty: Number(qty),
        price: Number(price),
        dest: loc,
        date: '25 Sep 2026',
        bids: 0,
        match: 95
      };

      window.FIELDORA_RFQ_DATA.unshift(newRfq);
      saveAndRenderRfqs();
      closeRfqModal();

      alert(\`🎉 RFQ Broadcasted Live to 12,400+ Verified FPOs!\\n\\nCommodity: \${crop}\\nQuantity: \${qty} Quintals\\nTarget Price: ₹\${price}/quintal\\nDelivery Location: \${loc}\\n\\nMatching producer groups have been notified via SMS & WhatsApp.\`);
      showBuyerTab('buyer-requirements');
    }
`;

// Replace existing handleBuyerPostRfq and handleRfqSubmit
const oldBuyerPostPattern = /function handleBuyerPostRfq\(e\) \{[\s\S]*?showBuyerTab\('buyer-requirements'\);\s*\}/;
html = html.replace(oldBuyerPostPattern, '');

const oldRfqSubmitPattern = /function handleRfqSubmit\(e\) \{[\s\S]*?showBuyerTab\('buyer-requirements'\);\s*\}/;
html = html.replace(oldRfqSubmitPattern, '');

// Append RFQ engine right after FIELDORA_PRODUCE_DATA engine
html = html.replace(
  "showFarmerTab('farmer-produce');\n    }",
  "showFarmerTab('farmer-produce');\n    }\n" + rfqEngineCode
);

// Call saveAndRenderRfqs() in DOMContentLoaded
html = html.replace(
  "saveAndRenderProduce();",
  "saveAndRenderProduce();\n      saveAndRenderRfqs();"
);

fs.writeFileSync(indexHtmlPath, html);
console.log('Successfully added RFQ synchronization to index.html!');
