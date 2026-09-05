const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(indexHtmlPath, 'utf8');

const accurateDynamicMatchCode = `
    // =========================================================================
    // ACCURATE DYNAMIC MATCH ENGINE: Real-Time Economic Viability Model
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
        return 0; // Non-matching commodity
      }

      // 1. Crop Match: 100% (Weight: 25%)
      const cropScore = 100;

      // 2. Variety Match (Weight: 15%)
      let varietyScore = 100;
      if (variety && matchLot.variety) {
        const v1 = variety.toLowerCase();
        const v2 = matchLot.variety.toLowerCase();
        if (!v1.includes(v2) && !v2.includes(v1) && v1 !== v2) {
          varietyScore = 30; // Heavy penalty if buyer requires different variety
        }
      }

      // 3. Quantity Supply Match (Weight: 20%)
      const supplyQty = Number(matchLot.qty || 50);
      const reqQty = Number(qty || 50);
      const qtyScore = Math.min(100, Math.max(5, (supplyQty / reqQty) * 100));

      // 4. Price Fairness & Viability Match (Weight: 40%)
      const farmerPrice = Number(matchLot.price || 2750);
      const buyerPrice = Number(price || 0);

      // If price is less than 5% of market rate (e.g. ₹2 vs ₹2,750), it is completely unviable
      const priceRatio = farmerPrice > 0 ? (buyerPrice / farmerPrice) : 0;
      if (priceRatio <= 0.05) {
        return 0; // 0% match for absurdly lowball bids
      }

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
        priceScore = Math.round(priceRatio * 60);
      }

      // Base Multi-Factor Score
      const baseScore =
        cropScore * 0.25 +
        varietyScore * 0.15 +
        qtyScore * 0.20 +
        priceScore * 0.40;

      // Realistic transaction viability curve for lower bids
      let finalScore = baseScore;
      if (priceRatio < 0.7) {
        finalScore = baseScore * Math.pow(priceRatio, 1.2);
      }

      return Math.min(99, Math.max(0, Math.round(finalScore)));
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
        if (matchPct < 25) {
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

// Replace calculateDynamicMatch function
const calcPattern = /\/\/ =========================================================================\s*\/\/ (DYNAMIC MATCH ENGINE|ACCURATE DYNAMIC MATCH ENGINE)[\s\S]*?return Math\.min\(99, Math\.max\(\d+, Math\.round\(finalScore\)\)\);\s*\}|function calculateDynamicMatch\(crop, variety, qty, price, loc\) \{[\s\S]*?return Math\.min\(99, Math\.max\(\d+, total\)\);\s*\}/;
html = html.replace(calcPattern, accurateDynamicMatchCode.trim());

// Replace renderFarmerDemands
const renderPattern = /function renderFarmerDemands\(\) \{[\s\S]*?container\.innerHTML = window\.FIELDORA_RFQ_DATA\.map\(rfq => `[\s\S]*?`\)\.join\(''\);\s*\}/;
html = html.replace(renderPattern, renderFarmerDemandsCode.trim());

fs.writeFileSync(indexHtmlPath, html);
console.log('Successfully updated index.html with accurate economic viability matching!');
