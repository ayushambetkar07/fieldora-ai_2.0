const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(indexHtmlPath, 'utf8');

// Dynamic match calculation function for frontend
const dynamicMatchFunc = `
    // =========================================================================
    // DYNAMIC MATCH ENGINE: Real-time Multi-Factor Calculation
    // =========================================================================
    function calculateDynamicMatch(crop, variety, qty, price, loc) {
      const farmerLots = window.FIELDORA_PRODUCE_DATA || [];
      const lowerCrop = (crop || '').toLowerCase();
      
      // Find matching farmer lot
      const matchLot = farmerLots.find(l => {
        const c = (l.crop || '').toLowerCase();
        return c.includes(lowerCrop) || lowerCrop.includes(c);
      });

      if (!matchLot) {
        return 20; // Minimal baseline for cross-commodity mismatch
      }

      // 1. Crop Match: 100%
      const cropScore = 100;

      // 2. Variety Match (20%)
      let varietyScore = 100;
      if (variety && matchLot.variety) {
        const v1 = variety.toLowerCase();
        const v2 = matchLot.variety.toLowerCase();
        if (v1.includes(v2) || v2.includes(v1) || v1 === v2) {
          varietyScore = 100;
        } else {
          varietyScore = 30; // Variety penalty if different spec
        }
      }

      // 3. Quantity Match (25%)
      const supplyQty = Number(matchLot.qty || 50);
      const reqQty = Number(qty || 50);
      const qtyScore = Math.min(100, (supplyQty / reqQty) * 100);

      // 4. Price Fairness / Parity (25% Weight)
      // When buyer enters a low price compared to farmer asking price, score drops!
      const farmerPrice = Number(matchLot.price || 2800);
      const buyerPrice = Number(price || 2800);
      let priceScore = 100;
      if (buyerPrice < farmerPrice) {
        priceScore = Math.max(0, (buyerPrice / farmerPrice) * 100);
      } else {
        priceScore = 100;
      }

      // Final composite score: Crop(30%) + Variety(20%) + Quantity(25%) + Price(25%)
      const total = Math.round(
        cropScore * 0.30 +
        varietyScore * 0.20 +
        qtyScore * 0.25 +
        priceScore * 0.25
      );

      return Math.min(99, Math.max(10, total));
    }
`;

// Replace handleBuyerPostRfq
const newBuyerPostRfq = `function handleBuyerPostRfq(e) {
      if (e && e.preventDefault) e.preventDefault();
      const crop = document.getElementById('brfq-crop')?.value || 'Tomato';
      const variety = document.getElementById('brfq-variety')?.value || 'Grade A Table Spec';
      const qty = document.getElementById('brfq-qty')?.value || '100';
      const price = document.getElementById('brfq-price')?.value || '2800';
      const loc = document.getElementById('brfq-loc')?.value || 'FreshMart Central Distribution Hub, Bhiwandi';

      // Dynamically calculate the real match percentage
      const computedMatch = calculateDynamicMatch(crop, variety, qty, price, loc);

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
        match: computedMatch
      };

      window.FIELDORA_RFQ_DATA.unshift(newRfq);
      saveAndRenderRfqs();

      try {
        fetch('http://localhost:5000/api/buyer-requirements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            crop_name: crop,
            variety: variety,
            required_quantity: Number(qty),
            unit: 'quintal',
            target_price: Number(price),
            delivery_location: loc
          })
        }).then(r => r.json()).then(res => {
          if (res && res.data && res.data.id) {
            fetch('http://localhost:5000/api/buyer-requirements/' + res.data.id + '/matches')
              .then(mr => mr.json())
              .then(mdata => {
                if (mdata && mdata.matches && mdata.matches.length > 0) {
                  newRfq.match = mdata.matches[0].match_percentage;
                  saveAndRenderRfqs();
                }
              }).catch(() => {});
          }
        }).catch(() => {});
      } catch (err) {}

      alert(\`🎉 RFQ Tender Broadcasted Successfully!\\n\\nVolume: \${qty} Quintals \${crop} (\${variety})\\nTarget Rate: ₹\${price}/q\\nDestination: \${loc}\\nCalculated Match: \${computedMatch}%\\n\\n📈 Matching FPOs & regional farmers notified!\`);
      showBuyerTab('buyer-requirements');
    }`;

// Replace handleRfqSubmit
const newRfqSubmit = `function handleRfqSubmit(e) {
      if (e && e.preventDefault) e.preventDefault();
      const crop = document.getElementById('rfq-crop')?.value || 'Wheat';
      const qty = document.getElementById('rfq-qty')?.value || '100';
      const price = document.getElementById('rfq-price')?.value || '2500';
      const loc = document.getElementById('rfq-loc')?.value || 'Vashi Hub';
      
      const computedMatch = calculateDynamicMatch(crop, '', qty, price, loc);

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
        match: computedMatch
      };

      window.FIELDORA_RFQ_DATA.unshift(newRfq);
      saveAndRenderRfqs();
      closeRfqModal();

      alert(\`🎉 RFQ Broadcasted Live to Verified FPOs!\\n\\nCommodity: \${crop}\\nQuantity: \${qty} Quintals\\nTarget Price: ₹\${price}/quintal\\nCalculated Match: \${computedMatch}%\\n\\nMatching producer groups have been notified via SMS & WhatsApp.\`);
      showBuyerTab('buyer-requirements');
    }`;

// Replace old handleBuyerPostRfq
const buyerPattern = /function handleBuyerPostRfq\(e\) \{[\s\S]*?showBuyerTab\('buyer-requirements'\);\s*\}/;
html = html.replace(buyerPattern, newBuyerPostRfq);

// Replace old handleRfqSubmit
const rfqPattern = /function handleRfqSubmit\(e\) \{[\s\S]*?showBuyerTab\('buyer-requirements'\);\s*\}/;
html = html.replace(rfqPattern, newRfqSubmit);

// Add dynamicMatchFunc if not already present
if (!html.includes('function calculateDynamicMatch')) {
  html = html.replace(
    '// DYNAMIC RFQ & BUYER DEMAND SYNCHRONIZATION ENGINE',
    dynamicMatchFunc + '\n    // DYNAMIC RFQ & BUYER DEMAND SYNCHRONIZATION ENGINE'
  );
}

fs.writeFileSync(indexHtmlPath, html);
console.log('Successfully updated index.html with real dynamic match calculation!');
