const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(indexHtmlPath, 'utf8');

const refinedDynamicMatchCode = `
    // =========================================================================
    // ACCURATE DYNAMIC MATCH ENGINE: Real-Time Multi-Factor Match Model
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

      // 2. Variety & Quality Spec Match (Weight: 15%)
      let varietyScore = 100;
      const v1 = (variety || '').toLowerCase();
      const v2 = (matchLot.variety || '').toLowerCase();
      if (v1 && v2) {
        if (
          v1.includes(v2) ||
          v2.includes(v1) ||
          v1 === v2 ||
          v1.includes('grade a') ||
          v1.includes('standard') ||
          v1.includes('retail') ||
          v1.includes('table') ||
          v1.includes('premium') ||
          v1.includes('spec')
        ) {
          varietyScore = 100;
        } else {
          varietyScore = 70;
        }
      }

      // 3. Quantity Supply Coverage (Weight: 20%)
      const supplyQty = Number(matchLot.qty || 50);
      const reqQty = Math.max(1, Number(qty || 50));
      const qtyRatio = supplyQty / reqQty;
      const qtyScore = qtyRatio >= 1.0 ? 100 : Math.round(60 + qtyRatio * 40);

      // 4. Price Fairness & Viability Match (Weight: 40%)
      const farmerPrice = Number(matchLot.price || 2750);
      const buyerPrice = Number(price || 0);

      const priceRatio = farmerPrice > 0 ? (buyerPrice / farmerPrice) : 0;
      if (priceRatio <= 0.05) {
        return 0; // 0% match for absurdly lowball bids (< 5% of rate)
      }

      let priceScore = 0;
      if (priceRatio >= 1.0) {
        // Buyer offering at or above farmer asking price gets 100% price score
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

      // Composite Score: Crop(25%) + Variety(15%) + Quantity(20%) + Price(40%)
      const baseScore =
        cropScore * 0.25 +
        varietyScore * 0.15 +
        qtyScore * 0.20 +
        priceScore * 0.40;

      let finalScore = baseScore;
      if (priceRatio < 0.7) {
        finalScore = baseScore * Math.pow(priceRatio, 1.2);
      }

      return Math.min(99, Math.max(0, Math.round(finalScore)));
    }
`;

const calcPattern = /\/\/ =========================================================================\s*\/\/ (DYNAMIC MATCH ENGINE|ACCURATE DYNAMIC MATCH ENGINE)[\s\S]*?return Math\.min\(99, Math\.max\(\d+, Math\.round\(finalScore\)\)\);\s*\}/;
html = html.replace(calcPattern, refinedDynamicMatchCode.trim());

fs.writeFileSync(indexHtmlPath, html);
console.log('Successfully updated refined matching formula in index.html!');
