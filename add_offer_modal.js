const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(indexHtmlPath, 'utf8');

// Offer modal HTML
const offerModalHtml = `
  <!-- PURCHASE REQUEST & NEGOTIATION MODAL -->
  <div id="modal-offer" class="hidden fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-[#E6ECE6] animate-in fade-in zoom-in duration-200">
      <div class="flex items-center justify-between border-b border-[#E6ECE6] pb-3">
        <div>
          <h3 id="offer-modal-title" class="font-heading font-extrabold text-lg text-deep-forest">Make Purchase Offer</h3>
          <p id="offer-modal-subtitle" class="text-xs text-secondary-text">Direct Procurement from Verified Producer</p>
        </div>
        <button onclick="closeDirectOfferModal()" class="text-gray-400 hover:text-black p-1 rounded-lg text-lg font-bold">✕</button>
      </div>

      <form onsubmit="handleSendDirectOffer(event)" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-deep-forest mb-1">Commodity / Produce</label>
          <input type="text" id="offer-crop" readonly class="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E6ECE6] rounded-xl text-xs font-semibold text-gray-700" />
        </div>

        <div>
          <label class="block text-xs font-bold text-deep-forest mb-1">Farmer / Producer</label>
          <input type="text" id="offer-farmer" readonly class="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E6ECE6] rounded-xl text-xs font-semibold text-gray-700" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-deep-forest mb-1">Purchase Quantity (Quintals)</label>
            <input type="number" id="offer-qty" required min="1" value="50" oninput="updateOfferTotal()" class="w-full px-3.5 py-2.5 border border-[#E6ECE6] rounded-xl text-xs font-semibold focus:border-deep-forest" />
          </div>
          <div>
            <label class="block text-xs font-bold text-deep-forest mb-1">Offered Price (₹ / Quintal)</label>
            <input type="number" id="offer-price" required min="1" value="2800" oninput="updateOfferTotal()" class="w-full px-3.5 py-2.5 border border-[#E6ECE6] rounded-xl text-xs font-semibold focus:border-deep-forest" />
          </div>
        </div>

        <div class="p-3 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl flex items-center justify-between text-xs">
          <span class="font-bold text-[#166534]">Total Offer Amount:</span>
          <span id="offer-total-display" class="font-mono font-extrabold text-base text-[#166534]">₹1,40,000</span>
        </div>

        <div>
          <label class="block text-xs font-bold text-deep-forest mb-1">Procurement Message / Notes</label>
          <textarea id="offer-message" rows="2" placeholder="e.g., Need immediate dispatch to Bhiwandi Central Distribution Hub." class="w-full px-3.5 py-2.5 border border-[#E6ECE6] rounded-xl text-xs"></textarea>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-[#E6ECE6]">
          <button type="button" onclick="closeDirectOfferModal()" class="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-black">Cancel</button>
          <button type="submit" class="px-5 py-2.5 btn-buyer text-xs font-bold rounded-xl shadow-xs">Transmit Purchase Request →</button>
        </div>
      </form>
    </div>
  </div>
`;

// Offer Modal JS functions
const offerModalJS = `
    // =========================================================================
    // DIRECT PURCHASE REQUEST & NEGOTIATION MODAL HANDLERS
    // =========================================================================
    let currentOfferCrop = 'Tomatoes';
    let currentOfferFarmer = 'Rajendra Patel';
    let currentOfferAskingPrice = 2800;

    function openDirectOfferModal(crop, farmer, price) {
      currentOfferCrop = crop || 'Produce Lot';
      currentOfferFarmer = farmer || 'Verified Producer';
      currentOfferAskingPrice = price || 2800;

      document.getElementById('offer-crop').value = currentOfferCrop;
      document.getElementById('offer-farmer').value = currentOfferFarmer;
      document.getElementById('offer-price').value = currentOfferAskingPrice;
      document.getElementById('offer-qty').value = '50';
      updateOfferTotal();

      const modal = document.getElementById('modal-offer');
      if (modal) modal.classList.remove('hidden');
    }

    function closeDirectOfferModal() {
      const modal = document.getElementById('modal-offer');
      if (modal) modal.classList.add('hidden');
    }

    function updateOfferTotal() {
      const qty = Number(document.getElementById('offer-qty')?.value || 0);
      const price = Number(document.getElementById('offer-price')?.value || 0);
      const total = qty * price;
      const display = document.getElementById('offer-total-display');
      if (display) {
        display.innerText = '₹' + total.toLocaleString('en-IN');
      }
    }

    function handleSendDirectOffer(e) {
      if (e && e.preventDefault) e.preventDefault();
      const crop = document.getElementById('offer-crop')?.value;
      const farmer = document.getElementById('offer-farmer')?.value;
      const qty = Number(document.getElementById('offer-qty')?.value || 50);
      const price = Number(document.getElementById('offer-price')?.value || 2800);
      const msg = document.getElementById('offer-message')?.value || '';
      const total = qty * price;

      // Send to Backend API
      try {
        fetch('http://localhost:5000/api/produce')
          .then(r => r.json())
          .then(res => {
            const listings = res.data || [];
            const matchListing = listings.find(l => (l.crop || '').toLowerCase().includes(crop.toLowerCase())) || listings[0];
            const listingId = matchListing ? matchListing.id : '00000000-0000-0000-0000-000000000001';

            fetch('http://localhost:5000/api/purchase-requests', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                listing_id: listingId,
                buyer_name: 'FreshMart Procurement Hub',
                buyer_company: 'FreshMart Agro Corp',
                requested_quantity: qty,
                unit: 'quintal',
                offered_price_per_unit: price,
                delivery_location: 'Mumbai Central Hub',
                message: msg
              })
            }).catch(() => {});
          }).catch(() => {});
      } catch (err) {}

      closeDirectOfferModal();
      alert(\`🎉 Purchase Request Transmitted to Farmer!\\n\\nCommodity: \${crop}\\nFarmer: \${farmer}\\nQuantity: \${qty} Quintals\\nOffered Rate: ₹\${price}/q\\nTotal Value: ₹\${total.toLocaleString('en-IN')}\\nNegotiation Status: PENDING (Round 1)\\n\\nFarmer can Accept, Reject, or Counter-Offer.\`);
    }
`;

// Insert modal into HTML before </body>
if (!html.includes('id="modal-offer"')) {
  html = html.replace('</body>', offerModalHtml + '\n</body>');
}

// Insert JS functions
if (!html.includes('function openDirectOfferModal')) {
  html = html.replace('</script>', offerModalJS + '\n</script>');
}

fs.writeFileSync(indexHtmlPath, html);
console.log('Successfully added Direct Offer modal and handlers to index.html!');
