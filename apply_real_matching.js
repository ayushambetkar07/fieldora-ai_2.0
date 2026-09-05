const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(indexHtmlPath, 'utf8');

const dynamicMatchCode = `
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
        return 15; // Non-matching commodity baseline
      }

      // 1. Crop Match: 100% (Weight: 25%)
      const cropScore = 100;

      // 2. Variety Match (Weight: 15%)
      let varietyScore = 100;
      if (variety && matchLot.variety) {
        const v1 = variety.toLowerCase();
        const v2 = matchLot.variety.toLowerCase();
        if (!v1.includes(v2) && !v2.includes(v1) && v1 !== v2) {
          varietyScore = 40;
        }
      }

      // 3. Quantity Match (Weight: 20%)
      const supplyQty = Number(matchLot.qty || 50);
      const reqQty = Number(qty || 50);
      const qtyScore = Math.min(100, Math.max(10, (supplyQty / reqQty) * 100));

      // 4. Price Parity Match (Weight: 40% - Primary determinant for transaction viability)
      const farmerPrice = Number(matchLot.price || 2750);
      const buyerPrice = Number(price || 2750);
      
      let priceRatio = buyerPrice / farmerPrice;
      let priceScore = 0;
      if (priceRatio >= 1.0) {
        priceScore = 100;
      } else if (priceRatio >= 0.9) {
        priceScore = 90 + (priceRatio - 0.9) * 100;
      } else if (priceRatio >= 0.75) {
        priceScore = 70 + ((priceRatio - 0.75) / 0.15) * 20;
      } else if (priceRatio >= 0.5) {
        priceScore = 30 + ((priceRatio - 0.5) / 0.25) * 40;
      } else {
        priceScore = Math.max(0, Math.round(priceRatio * 50));
      }

      // Total Score: Crop(25%) + Variety(15%) + Quantity(20%) + Price(40%)
      let total = Math.round(
        cropScore * 0.25 +
        varietyScore * 0.15 +
        qtyScore * 0.20 +
        priceScore * 0.40
      );

      // If price is an extreme lowball (< 50% of market rate), apply viability dampener
      if (priceRatio < 0.5) {
        total = Math.round(total * (0.25 + priceRatio));
      }

      return Math.min(99, Math.max(8, total));
    }
`;

const renderFarmerDemandsCode = `
    function renderFarmerDemands() {
      const container = document.getElementById('farmer-demands-list');
      if (!container) return;

      container.innerHTML = window.FIELDORA_RFQ_DATA.map(rfq => {
        // ALWAYS dynamically compute the real accurate percentage on render
        const matchPct = calculateDynamicMatch(rfq.crop, rfq.variety, rfq.qty, rfq.price, rfq.dest);
        rfq.match = matchPct; // Update the memory object

        let badgeBg = 'bg-deep-forest text-white';
        let barBg = 'bg-deep-forest';
        if (matchPct < 50) {
          badgeBg = 'bg-rose-700 text-white';
          barBg = 'bg-rose-600';
        } else if (matchPct < 75) {
          badgeBg = 'bg-amber-600 text-white';
          barBg = 'bg-amber-500';
        }

        return \`
          <div class="ref-card p-6 space-y-3">
            <div class="flex items-start justify-between flex-wrap gap-2">
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="font-bold text-base text-deep-forest">\${rfq.buyer || 'Enterprise Buyer'}</h3>
                  <span class="px-2.5 py-0.5 bg-[#dcfce7] text-[#166534] text-[10px] font-bold rounded-full">\${rfq.buyerType || 'Verified Buyer'}</span>
                </div>
                <p class="text-xs text-secondary-text">Required: \${rfq.qty} Quintals \${rfq.crop} • Destination: \${rfq.dest || 'Distribution Center'} • Target Rate: ₹\${Number(rfq.price).toLocaleString('en-IN')}/q</p>
              </div>
              <span class="px-3 py-1 \${badgeBg} font-mono font-bold text-xs rounded-full shadow-2xs">
                \${matchPct}% Match
              </span>
            </div>

            <div class="w-full bg-[#E6ECE6] h-2 rounded-full overflow-hidden">
              <div class="\${barBg} h-full rounded-full transition-all duration-500" style="width: \${matchPct}%"></div>
            </div>

            <div class="flex items-center justify-between pt-2 border-t border-[#E6ECE6] text-xs flex-wrap gap-2">
              <span class="text-secondary-text">Payment: <strong>100% Escrow deposit locked</strong></span>
              <button onclick="alert('Offer transmitted directly to \${rfq.buyer || 'Buyer Procurement'}!')" class="px-4 py-2 btn-farmer text-xs font-bold rounded-xl shadow-xs">
                Respond with Lot Availability
              </button>
            </div>
          </div>
        \`;
      }).join('');
    }
`;

// Replace calculateDynamicMatch
const oldMatchPattern = /\/\/ =========================================================================\s*\/\/ DYNAMIC MATCH ENGINE[\s\S]*?return Math\.min\(99, Math\.max\(10, total\)\);\s*\}/;
if (html.match(oldMatchPattern)) {
  html = html.replace(oldMatchPattern, dynamicMatchCode.trim());
} else if (!html.includes('function calculateDynamicMatch')) {
  html = html.replace(
    '// DYNAMIC RFQ & BUYER DEMAND SYNCHRONIZATION ENGINE',
    dynamicMatchCode + '\n    // DYNAMIC RFQ & BUYER DEMAND SYNCHRONIZATION ENGINE'
  );
}

// Replace renderFarmerDemands
const oldRenderDemandsPattern = /function renderFarmerDemands\(\) \{[\s\S]*?container\.innerHTML = window\.FIELDORA_RFQ_DATA\.map\(rfq => `[\s\S]*?`\)\.join\(''\);\s*\}/;
html = html.replace(oldRenderDemandsPattern, renderFarmerDemandsCode.trim());

fs.writeFileSync(indexHtmlPath, html);
console.log('Successfully updated index.html with live on-the-fly match rendering!');
