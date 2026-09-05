const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(indexHtmlPath, 'utf8');

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
        return 18; // Low baseline score for non-matching commodity
      }

      // 1. Crop Match: 100% (30% weight -> 30 pts)
      const cropScore = 100;

      // 2. Variety Match (20% weight -> 20 pts)
      let varietyScore = 100;
      if (variety && matchLot.variety) {
        const v1 = variety.toLowerCase();
        const v2 = matchLot.variety.toLowerCase();
        if (v1.includes(v2) || v2.includes(v1) || v1 === v2) {
          varietyScore = 100;
        } else {
          varietyScore = 20; // Heavy penalty if buyer wants a different variety
        }
      }

      // 3. Quantity Supply Match (25% weight -> 25 pts)
      const supplyQty = Number(matchLot.qty || 50);
      const reqQty = Number(qty || 50);
      const qtyScore = Math.min(100, Math.max(10, (supplyQty / reqQty) * 100));

      // 4. Price Fairness & Parity Match (25% weight -> 25 pts)
      // Uses progressive power curve: if buyer offers low price, score drops sharply!
      const farmerPrice = Number(matchLot.price || 2800);
      const buyerPrice = Number(price || 2800);
      let priceScore = 100;
      if (buyerPrice < farmerPrice) {
        const ratio = Math.max(0, buyerPrice / farmerPrice);
        priceScore = Math.round(Math.pow(ratio, 2) * 100);
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

      return Math.min(99, Math.max(12, total));
    }
`;

// Replace calculateDynamicMatch function
const oldMatchPattern = /\/\/ =========================================================================\s*\/\/ DYNAMIC MATCH ENGINE[\s\S]*?return Math\.min\(99, Math\.max\(10, total\)\);\s*\}/;
if (html.match(oldMatchPattern)) {
  html = html.replace(oldMatchPattern, dynamicMatchFunc.trim());
} else if (!html.includes('function calculateDynamicMatch')) {
  html = html.replace(
    '// DYNAMIC RFQ & BUYER DEMAND SYNCHRONIZATION ENGINE',
    dynamicMatchFunc + '\n    // DYNAMIC RFQ & BUYER DEMAND SYNCHRONIZATION ENGINE'
  );
}

fs.writeFileSync(indexHtmlPath, html);
console.log('Successfully updated calculateDynamicMatch formula!');
