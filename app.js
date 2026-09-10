/**
 * Fieldora - Platinum Elite Agricultural Marketplace & Intelligence
 * Unified Application Controller
 */

// Application State
const AppState = {
  currentRole: localStorage.getItem('fieldora_role') || 'buyer', // 'buyer' | 'farmer'
  activeRoute: 'role-select',
  cart: JSON.parse(localStorage.getItem('fieldora_rfq_cart') || '[]'),
  filters: {
    search: '',
    category: 'all',
    onlyOrganic: false,
    onlyElite: false,
    sortBy: 'recommended'
  },
  selectedProduce: null,
  activeForecastCrop: 'wheat',
  chartInstances: {}
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
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
});

/* -------------------------------------------------------------
 * 1. Router & Navigation
 * ------------------------------------------------------------- */
function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  
  // Handle initial route - defaults to role-select (I am Farmer / I am Buyer)
  const hash = window.location.hash.replace('#', '') || 'role-select';
  navigateTo(hash, false);

  // Bind nav click events
  document.querySelectorAll('[data-route]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const route = el.getAttribute('data-route');
      navigateTo(route);
    });
  });
}

function handleRoute() {
  const hash = window.location.hash.replace('#', '') || 'role-select';
  navigateTo(hash, false);
}

function navigateTo(routeId, updateHash = true) {
  // Validate route
  const validRoutes = [
    'role-select', 'home', 'marketplace', 'elite-marketplace', 'buyer-dashboard', 
    'farmer-dashboard', 'procurement-ai', 'post-rfq', 'order-history', 
    'my-produce', 'farmer-insights', 'asset-management', 'login'
  ];

  const targetRoute = validRoutes.includes(routeId) ? routeId : 'role-select';
  AppState.activeRoute = targetRoute;

  if (updateHash && window.location.hash !== `#${targetRoute}`) {
    window.location.hash = `#${targetRoute}`;
  }

  // Update UI views
  document.querySelectorAll('.view-section').forEach(view => {
    view.classList.remove('active');
  });

  const activeView = document.getElementById(`view-${targetRoute}`);
  if (activeView) {
    activeView.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update Nav Links Active States
  document.querySelectorAll('[data-route]').forEach(link => {
    if (link.getAttribute('data-route') === targetRoute) {
      link.classList.add('text-primary', 'font-bold');
      link.classList.remove('text-secondary');
    } else {
      link.classList.remove('text-primary', 'font-bold');
      link.classList.add('text-secondary');
    }
  });

  // Trigger route-specific initializations
  if (targetRoute === 'marketplace' || targetRoute === 'elite-marketplace') {
    AppState.filters.onlyElite = (targetRoute === 'elite-marketplace');
    renderMarketplace();
  } else if (targetRoute === 'procurement-ai') {
    setTimeout(renderForecastChart, 100);
  } else if (targetRoute === 'buyer-dashboard') {
    setTimeout(renderBuyerSpendChart, 100);
  } else if (targetRoute === 'farmer-insights') {
    setTimeout(renderFarmerPriceChart, 100);
  }

  // Close mobile drawer if open
  closeMobileMenu();
}

/* -------------------------------------------------------------
 * 2. Mandi Ticker Bar
 * ------------------------------------------------------------- */
function initTicker() {
  const tickerContainer = document.getElementById('ticker-content');
  if (!tickerContainer || !window.FIELDORA_DATA) return;

  const items = window.FIELDORA_DATA.mandiTicker;
  let tickerHtml = '';

  // Render items twice for infinite loop seamless scroll
  const renderList = [...items, ...items];
  renderList.forEach(item => {
    const isUp = item.trend === 'up';
    const trendIcon = isUp ? 'trending_up' : 'trending_down';
    const trendColor = isUp ? 'text-green-400' : 'text-red-400';

    tickerHtml += `
      <span class="inline-flex items-center gap-2 mx-6 text-sm font-medium">
        <span class="text-white/90 font-semibold">${item.commodity}</span>
        <span class="text-white/60 text-xs">(${item.mandi})</span>
        <span class="text-white font-mono font-bold">${item.price}</span>
        <span class="${trendColor} flex items-center text-xs font-mono">
          <span class="material-symbols-outlined text-xs mr-0.5">${trendIcon}</span>${item.change}
        </span>
        <span class="text-white/20 mx-2">|</span>
      </span>
    `;
  });

  tickerContainer.innerHTML = tickerHtml;
}

/* -------------------------------------------------------------
 * 3. Role Management & Session
 * ------------------------------------------------------------- */
function initRoleState() {
  updateRoleUI(AppState.currentRole);

  const roleSelectors = document.querySelectorAll('[data-set-role]');
  roleSelectors.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedRole = btn.getAttribute('data-set-role');
      setRole(selectedRole);
    });
  });
}

function setRole(role) {
  AppState.currentRole = role;
  localStorage.setItem('fieldora_role', role);
  updateRoleUI(role);

  showToast('Portal Selected', `Entered ${role === 'farmer' ? 'Farmer / Producer' : 'Enterprise Buyer'} Portal`, 'success');

  // Intelligent navigation on role switch
  if (role === 'farmer') {
    navigateTo('farmer-dashboard');
  } else {
    navigateTo('home');
  }
}

function updateRoleUI(role) {
  const badgeEl = document.getElementById('current-role-badge');
  const userGreetingEl = document.getElementById('user-greeting-name');
  
  if (badgeEl) {
    if (role === 'farmer') {
      badgeEl.innerHTML = `<span class="live-dot mr-1.5 bg-amber-500"></span> 🌾 Farmer (FPO) <span class="material-symbols-outlined text-xs ml-1 opacity-70">sync_alt</span>`;
      badgeEl.className = 'px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-semibold flex items-center cursor-pointer hover:bg-amber-200 transition-colors shadow-2xs';
      badgeEl.title = 'Click to switch to Buyer portal';
    } else {
      badgeEl.innerHTML = `<span class="live-dot mr-1.5"></span> 🏢 Buyer (Enterprise) <span class="material-symbols-outlined text-xs ml-1 opacity-70">sync_alt</span>`;
      badgeEl.className = 'px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-xs font-semibold flex items-center cursor-pointer hover:bg-emerald-200 transition-colors shadow-2xs';
      badgeEl.title = 'Click to switch to Farmer portal';
    }
  }

  if (userGreetingEl) {
    if (role === 'farmer') {
      userGreetingEl.innerText = 'Rajendra Patel (FPO Lead)';
    } else {
      userGreetingEl.innerText = 'ITC Procurement Team';
    }
  }
}

/* -------------------------------------------------------------
 * 4. Marketplace Engine & Filtering
 * ------------------------------------------------------------- */
function initMarketplace() {
  const searchInput = document.getElementById('marketplace-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      AppState.filters.search = e.target.value.toLowerCase();
      renderMarketplace();
    });
  }

  // Category filter pills
  document.querySelectorAll('[data-filter-category]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter-category]').forEach(b => {
        b.classList.remove('bg-primary', 'text-white');
        b.classList.add('bg-white', 'text-secondary');
      });
      btn.classList.add('bg-primary', 'text-white');
      btn.classList.remove('bg-white', 'text-secondary');

      AppState.filters.category = btn.getAttribute('data-filter-category');
      renderMarketplace();
    });
  });

  // Sort dropdown
  const sortSelect = document.getElementById('marketplace-sort');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      AppState.filters.sortBy = e.target.value;
      renderMarketplace();
    });
  }

  // Organic checkbox
  const organicCheck = document.getElementById('filter-organic');
  if (organicCheck) {
    organicCheck.addEventListener('change', (e) => {
      AppState.filters.onlyOrganic = e.target.checked;
      renderMarketplace();
    });
  }

  renderMarketplace();
}

function renderMarketplace() {
  const container = document.getElementById('marketplace-grid');
  if (!container || !window.FIELDORA_DATA) return;

  let items = [...window.FIELDORA_DATA.produceItems];

  // Search Filter
  if (AppState.filters.search) {
    const q = AppState.filters.search;
    items = items.filter(item => 
      item.name.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q) ||
      item.variety.toLowerCase().includes(q) ||
      item.farmerName.toLowerCase().includes(q)
    );
  }

  // Category Filter
  if (AppState.filters.category !== 'all') {
    items = items.filter(item => item.categoryKey === AppState.filters.category);
  }

  // Organic Filter
  if (AppState.filters.onlyOrganic) {
    items = items.filter(item => item.isOrganic);
  }

  // Elite Filter
  if (AppState.filters.onlyElite) {
    items = items.filter(item => item.isElite);
  }

  // Sorting
  if (AppState.filters.sortBy === 'price-low') {
    items.sort((a, b) => a.pricePerQtl - b.pricePerQtl);
  } else if (AppState.filters.sortBy === 'price-high') {
    items.sort((a, b) => b.pricePerQtl - a.pricePerQtl);
  } else if (AppState.filters.sortBy === 'rating') {
    items.sort((a, b) => b.farmerRating - a.farmerRating);
  }

  // Update item counter
  const counterEl = document.getElementById('marketplace-count');
  if (counterEl) {
    counterEl.innerText = `${items.length} verified lots found`;
  }

  if (items.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center glass-card-elite rounded-2xl">
        <span class="material-symbols-outlined text-5xl text-gray-400 mb-3">inventory_2</span>
        <h3 class="text-xl font-bold text-gray-700">No matching produce lots found</h3>
        <p class="text-gray-500 text-sm mt-1">Try relaxing your search terms or category filters.</p>
        <button onclick="resetMarketplaceFilters()" class="mt-4 px-5 py-2 btn-elite-secondary text-sm">Reset All Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="glass-card-elite rounded-2xl overflow-hidden flex flex-col justify-between group">
      <div>
        <!-- Image & Badges -->
        <div class="relative h-52 overflow-hidden bg-slate-100">
          <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
          <div class="absolute top-3 left-3 flex flex-wrap gap-1.5">
            ${item.isElite ? `<span class="px-2.5 py-1 bg-amber-500/90 backdrop-blur-md text-white rounded-full text-xs font-bold shadow-sm flex items-center gap-1"><span class="material-symbols-outlined text-xs">verified</span> Platinum</span>` : ''}
            ${item.isOrganic ? `<span class="px-2.5 py-1 bg-emerald-600/90 backdrop-blur-md text-white rounded-full text-xs font-semibold shadow-sm">100% Organic</span>` : ''}
          </div>
          <div class="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-xs font-mono">
            Avail: ${item.availableQtl} Qtl
          </div>
        </div>

        <!-- Details Content -->
        <div class="p-5">
          <div class="flex items-center justify-between text-xs text-secondary mb-1.5">
            <span class="font-semibold uppercase tracking-wider">${item.category}</span>
            <span class="flex items-center gap-1 text-amber-600 font-bold">
              <span class="material-symbols-outlined text-xs icon-fill">star</span>${item.farmerRating} (${item.farmerDeals} deals)
            </span>
          </div>

          <h3 class="font-bold text-lg text-deep-forest group-hover:text-primary transition-colors line-clamp-1 mb-1">
            ${item.name}
          </h3>

          <p class="text-xs text-gray-500 flex items-center gap-1 mb-3">
            <span class="material-symbols-outlined text-sm text-gray-400">location_on</span>
            ${item.location}
          </p>

          <!-- Key Specs -->
          <div class="grid grid-cols-2 gap-2 bg-emerald-50/60 rounded-xl p-2.5 text-xs text-gray-700 mb-4 border border-emerald-100/50">
            <div>
              <span class="text-gray-400 block text-[11px]">Moisture</span>
              <span class="font-semibold text-emerald-900">${item.moisture}</span>
            </div>
            <div>
              <span class="text-gray-400 block text-[11px]">Quality Grade</span>
              <span class="font-semibold text-emerald-900 truncate block">${item.grade}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Price & Actions Footer -->
      <div class="px-5 pb-5 pt-0">
        <div class="flex items-baseline justify-between mb-4 border-t border-gray-100 pt-3">
          <div>
            <span class="text-xs text-gray-400 block">Direct Farm Rate</span>
            <div class="text-2xl font-black text-primary font-mono">₹${item.pricePerQtl.toLocaleString()} <span class="text-xs font-normal text-gray-500">/ Qtl</span></div>
          </div>
          <span class="text-[11px] text-gray-500 bg-gray-100 px-2 py-1 rounded">Min: ${item.minOrderQtl} Qtl</span>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button onclick="openProduceModal('${item.id}')" class="py-2 px-3 btn-elite-secondary text-xs font-semibold text-center">
            Inspect Lot
          </button>
          <button onclick="addToRFQCart('${item.id}')" class="py-2 px-3 btn-elite-primary text-xs font-semibold text-center">
            Add to RFQ
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function resetMarketplaceFilters() {
  AppState.filters = {
    search: '',
    category: 'all',
    onlyOrganic: false,
    onlyElite: false,
    sortBy: 'recommended'
  };

  const searchInput = document.getElementById('marketplace-search');
  if (searchInput) searchInput.value = '';

  const organicCheck = document.getElementById('filter-organic');
  if (organicCheck) organicCheck.checked = false;

  document.querySelectorAll('[data-filter-category]').forEach(b => {
    if (b.getAttribute('data-filter-category') === 'all') {
      b.classList.add('bg-primary', 'text-white');
      b.classList.remove('bg-white', 'text-secondary');
    } else {
      b.classList.remove('bg-primary', 'text-white');
      b.classList.add('bg-white', 'text-secondary');
    }
  });

  renderMarketplace();
}

/* -------------------------------------------------------------
 * 5. Produce Modal & RFQ Cart System
 * ------------------------------------------------------------- */
function openProduceModal(productId) {
  const item = window.FIELDORA_DATA.produceItems.find(p => p.id === productId);
  if (!item) return;

  AppState.selectedProduce = item;
  const modalEl = document.getElementById('produce-detail-modal');
  const modalContentEl = document.getElementById('produce-modal-body');

  modalContentEl.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="space-y-4">
        <div class="h-64 rounded-2xl overflow-hidden shadow-inner bg-slate-100">
          <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">
        </div>
        <div class="p-4 bg-emerald-50/70 border border-emerald-200/60 rounded-xl space-y-2">
          <div class="text-xs font-bold uppercase tracking-wider text-primary">Farm & Producer Origin</div>
          <div class="text-base font-bold text-deep-forest">${item.farmName}</div>
          <div class="text-xs text-gray-600 flex items-center gap-1">
            <span class="material-symbols-outlined text-sm text-emerald-700">verified_user</span> Lead Farmer: ${item.farmerName} (${item.farmerRating} ★ rating, ${item.farmerDeals} successful institutional deliveries)
          </div>
          <div class="text-xs text-gray-500">Origin: ${item.location}</div>
        </div>
      </div>

      <div class="space-y-4 flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">${item.grade}</span>
            ${item.isOrganic ? `<span class="px-2.5 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded-full">NPOP Organic</span>` : ''}
            <span class="px-2.5 py-0.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">Lot ID: ${item.id}</span>
          </div>

          <h2 class="text-2xl font-bold text-deep-forest">${item.name}</h2>
          <p class="text-xs text-gray-500 font-mono mt-0.5">Variety: ${item.variety}</p>

          <p class="text-sm text-gray-600 mt-3 leading-relaxed">
            ${item.description}
          </p>

          <!-- Specifications Table -->
          <div class="mt-4 grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div><span class="text-gray-400 block">Moisture Content:</span> <strong class="text-gray-800">${item.moisture}</strong></div>
            <div><span class="text-gray-400 block">Harvest Period:</span> <strong class="text-gray-800">${item.harvestDate}</strong></div>
            <div><span class="text-gray-400 block">Available Quantity:</span> <strong class="text-gray-800">${item.availableQtl} Quintals</strong></div>
            <div><span class="text-gray-400 block">Min. Order Lot:</span> <strong class="text-gray-800">${item.minOrderQtl} Quintals</strong></div>
          </div>

          <!-- Quality Certifications -->
          <div class="mt-3">
            <span class="text-xs text-gray-400 block mb-1.5 font-semibold">Quality & Lab Certifications:</span>
            <div class="flex flex-wrap gap-1.5">
              ${item.certifications.map(c => `<span class="text-xs bg-white border border-emerald-300 text-emerald-800 px-2.5 py-1 rounded-md shadow-2xs font-medium flex items-center gap-1"><span class="material-symbols-outlined text-xs text-emerald-600">task_alt</span> ${c}</span>`).join('')}
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-gray-200">
          <div class="flex items-baseline justify-between mb-4">
            <div>
              <span class="text-xs text-gray-400 block">Wholesale Rate</span>
              <span class="text-3xl font-black text-primary font-mono">₹${item.pricePerQtl.toLocaleString()}</span>
              <span class="text-xs text-gray-500">/ Quintal (Ex-Warehouse)</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <button onclick="addToRFQCart('${item.id}'); closeProduceModal();" class="py-3 btn-elite-primary text-sm font-semibold">
              <span class="material-symbols-outlined text-base">request_quote</span> Add to RFQ List
            </button>
            <button onclick="directOrderPrompt('${item.id}')" class="py-3 btn-elite-secondary text-sm font-semibold">
              <span class="material-symbols-outlined text-base">local_shipping</span> Instant Quote
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  modalEl.classList.remove('hidden');
}

function closeProduceModal() {
  const modalEl = document.getElementById('produce-detail-modal');
  if (modalEl) modalEl.classList.add('hidden');
}

function addToRFQCart(productId) {
  const item = window.FIELDORA_DATA.produceItems.find(p => p.id === productId);
  if (!item) return;

  const existing = AppState.cart.find(c => c.id === productId);
  if (existing) {
    existing.quantityQtl += item.minOrderQtl;
  } else {
    AppState.cart.push({
      id: item.id,
      name: item.name,
      pricePerQtl: item.pricePerQtl,
      quantityQtl: item.minOrderQtl,
      location: item.location,
      farmName: item.farmName
    });
  }

  localStorage.setItem('fieldora_rfq_cart', JSON.stringify(AppState.cart));
  renderCartBadge();
  showToast('Added to RFQ', `${item.name} (${item.minOrderQtl} Qtl) added to your procurement basket.`, 'success');
}

function renderCartBadge() {
  const badgeEls = document.querySelectorAll('.cart-badge-count');
  const count = AppState.cart.length;
  badgeEls.forEach(el => {
    el.innerText = count;
    if (count > 0) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });
}

function openCartDrawer() {
  const drawerEl = document.getElementById('rfq-cart-drawer');
  const backdropEl = document.getElementById('rfq-drawer-backdrop');
  const containerEl = document.getElementById('rfq-cart-items-container');
  const totalAmountEl = document.getElementById('rfq-cart-estimated-total');

  if (!drawerEl) return;

  if (AppState.cart.length === 0) {
    containerEl.innerHTML = `
      <div class="text-center py-16 text-gray-400">
        <span class="material-symbols-outlined text-5xl mb-2">shopping_bag</span>
        <p class="text-base font-semibold text-gray-600">Your RFQ basket is empty</p>
        <p class="text-xs text-gray-400 mt-1">Add verified produce lots from the marketplace to build a multi-farm tender.</p>
      </div>
    `;
    if (totalAmountEl) totalAmountEl.innerText = '₹0';
  } else {
    let total = 0;
    containerEl.innerHTML = AppState.cart.map((c, index) => {
      const itemSubtotal = c.pricePerQtl * c.quantityQtl;
      total += itemSubtotal;

      return `
        <div class="p-3.5 bg-white border border-gray-200 rounded-xl space-y-2 shadow-xs">
          <div class="flex justify-between items-start">
            <h4 class="font-bold text-sm text-deep-forest leading-snug">${c.name}</h4>
            <button onclick="removeCartItem(${index})" class="text-gray-400 hover:text-red-600 transition-colors">
              <span class="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
          <div class="text-xs text-gray-500">${c.farmName} • ${c.location}</div>
          <div class="flex justify-between items-center text-xs pt-2 border-t border-gray-100">
            <span class="font-mono text-gray-600">${c.quantityQtl} Qtl @ ₹${c.pricePerQtl}/Qtl</span>
            <span class="font-mono font-bold text-primary">₹${itemSubtotal.toLocaleString()}</span>
          </div>
        </div>
      `;
    }).join('');

    if (totalAmountEl) totalAmountEl.innerText = `₹${total.toLocaleString()}`;
  }

  drawerEl.classList.remove('translate-x-full');
  if (backdropEl) backdropEl.classList.remove('hidden');
}

function closeCartDrawer() {
  const drawerEl = document.getElementById('rfq-cart-drawer');
  const backdropEl = document.getElementById('rfq-drawer-backdrop');
  if (drawerEl) drawerEl.classList.add('translate-x-full');
  if (backdropEl) backdropEl.classList.add('hidden');
}

function removeCartItem(index) {
  AppState.cart.splice(index, 1);
  localStorage.setItem('fieldora_rfq_cart', JSON.stringify(AppState.cart));
  renderCartBadge();
  openCartDrawer();
}

function submitRFQFromCart() {
  if (AppState.cart.length === 0) {
    showToast('Empty Basket', 'Add items to submit an RFQ tender', 'info');
    return;
  }

  closeCartDrawer();
  AppState.cart = [];
  localStorage.setItem('fieldora_rfq_cart', JSON.stringify([]));
  renderCartBadge();

  showToast('RFQ Tender Dispatched', 'Your multi-lot RFQ tender has been broadcasted to verified FPOs and regional aggregators.', 'success');
  navigateTo('order-history');
}

function directOrderPrompt(productId) {
  closeProduceModal();
  navigateTo('post-rfq');
}

/* -------------------------------------------------------------
 * 6. Charts & Intelligence Engine
 * ------------------------------------------------------------- */
function initCharts() {
  // Chart initialization triggers on route transition
}

function renderForecastChart() {
  const canvas = document.getElementById('priceForecastCanvas');
  if (!canvas || !window.Chart) return;

  const cropKey = AppState.activeForecastCrop || 'wheat';
  const dataObj = window.FIELDORA_DATA.forecastTrends[cropKey];
  if (!dataObj) return;

  // Update text elements
  const peakEl = document.getElementById('forecast-peak-val');
  const volEl = document.getElementById('forecast-vol-val');
  const signalEl = document.getElementById('forecast-signal-val');
  const driverEl = document.getElementById('forecast-driver-val');

  if (peakEl) peakEl.innerText = dataObj.expectedPeak;
  if (volEl) volEl.innerText = dataObj.volatilityIndex;
  if (signalEl) signalEl.innerText = dataObj.procurementSignal;
  if (driverEl) driverEl.innerText = dataObj.driverSummary;

  if (AppState.chartInstances.forecast) {
    AppState.chartInstances.forecast.destroy();
  }

  const ctx = canvas.getContext('2d');
  const combinedPrices = [...dataObj.historical, ...dataObj.forecast];

  AppState.chartInstances.forecast = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dataObj.labels,
      datasets: [
        {
          label: `${dataObj.name} Spot & AI Forecast (₹/Qtl)`,
          data: combinedPrices,
          borderColor: '#004c22',
          backgroundColor: 'rgba(166, 244, 181, 0.25)',
          fill: true,
          tension: 0.35,
          pointRadius: 5,
          pointBackgroundColor: '#0B2B16',
          pointHoverRadius: 8,
          borderWidth: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0B2B16',
          titleFont: { family: 'Inter', size: 13 },
          bodyFont: { family: 'Inter', size: 14, weight: 'bold' },
          padding: 12,
          displayColors: false,
          callbacks: {
            label: (ctx) => `Rate: ₹${ctx.raw.toLocaleString()} / Quintal`
          }
        }
      },
      scales: {
        y: {
          grid: { color: 'rgba(0, 76, 34, 0.06)' },
          ticks: {
            callback: (val) => `₹${val}`,
            font: { family: 'Inter', size: 11 }
          }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Inter', size: 11 } }
        }
      }
    }
  });
}

function setForecastCrop(cropKey) {
  AppState.activeForecastCrop = cropKey;
  
  document.querySelectorAll('[data-forecast-crop]').forEach(btn => {
    if (btn.getAttribute('data-forecast-crop') === cropKey) {
      btn.classList.add('bg-primary', 'text-white');
      btn.classList.remove('bg-white', 'text-secondary');
    } else {
      btn.classList.remove('bg-primary', 'text-white');
      btn.classList.add('bg-white', 'text-secondary');
    }
  });

  renderForecastChart();
}

function renderBuyerSpendChart() {
  const canvas = document.getElementById('buyerSpendCanvas');
  if (!canvas || !window.Chart) return;

  if (AppState.chartInstances.buyerSpend) {
    AppState.chartInstances.buyerSpend.destroy();
  }

  const ctx = canvas.getContext('2d');
  AppState.chartInstances.buyerSpend = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Oct 25', 'Nov 25', 'Dec 25', 'Jan 26', 'Feb 26 (MTD)'],
      datasets: [
        {
          label: 'Direct Farm Sourcing (₹ Lakhs)',
          data: [42.5, 68.0, 94.2, 115.6, 142.8],
          backgroundColor: '#004c22',
          borderRadius: 8
        },
        {
          label: 'Cost Savings vs APMC Benchmarks (₹ Lakhs)',
          data: [6.2, 10.4, 15.1, 18.9, 23.4],
          backgroundColor: '#8bd79b',
          borderRadius: 8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { family: 'Inter', size: 12 }, usePointStyle: true }
        }
      },
      scales: {
        y: {
          grid: { color: 'rgba(0, 0, 0, 0.05)' },
          ticks: { callback: (v) => `₹${v}L` }
        },
        x: { grid: { display: false } }
      }
    }
  });
}

function renderFarmerPriceChart() {
  const canvas = document.getElementById('farmerParityCanvas');
  if (!canvas || !window.Chart) return;

  if (AppState.chartInstances.farmerParity) {
    AppState.chartInstances.farmerParity.destroy();
  }

  const ctx = canvas.getContext('2d');
  AppState.chartInstances.farmerParity = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['10 Feb', '14 Feb', '18 Feb', '22 Feb', '26 Feb', 'Today'],
      datasets: [
        {
          label: 'Fieldora Direct Institutional Bid (₹/Qtl)',
          data: [2650, 2690, 2720, 2740, 2750, 2780],
          borderColor: '#004c22',
          backgroundColor: 'rgba(0, 76, 34, 0.1)',
          fill: true,
          tension: 0.3,
          borderWidth: 3
        },
        {
          label: 'Local Mandi Average Rate (₹/Qtl)',
          data: [2480, 2500, 2510, 2530, 2550, 2580],
          borderColor: '#94a3b8',
          borderDash: [5, 5],
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { usePointStyle: true } }
      },
      scales: {
        y: { ticks: { callback: (v) => `₹${v}` } },
        x: { grid: { display: false } }
      }
    }
  });
}

/* -------------------------------------------------------------
 * 7. Order & Milestone Tracker System
 * ------------------------------------------------------------- */
function initOrderSystem() {
  renderOrderList();
  renderFarmerLots();
  renderAssetListings();
}

function renderOrderList() {
  const container = document.getElementById('order-list-container');
  if (!container || !window.FIELDORA_DATA) return;

  const orders = window.FIELDORA_DATA.orders;
  container.innerHTML = orders.map(order => {
    let statusBadge = '';
    if (order.status === 'Completed') {
      statusBadge = '<span class="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">Completed</span>';
    } else if (order.status === 'In Transit') {
      statusBadge = '<span class="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full flex items-center gap-1"><span class="live-dot bg-blue-600"></span> In Transit</span>';
    } else {
      statusBadge = '<span class="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">Quality QA</span>';
    }

    return `
      <div class="glass-card-elite rounded-2xl p-6 space-y-4">
        <div class="flex flex-wrap justify-between items-start gap-4">
          <div>
            <div class="flex items-center gap-3">
              <span class="font-mono font-bold text-base text-primary">${order.orderId}</span>
              ${statusBadge}
            </div>
            <h3 class="text-xl font-bold text-deep-forest mt-1">${order.produce}</h3>
            <p class="text-xs text-gray-500 mt-0.5">Supplier: <strong>${order.seller}</strong> | Buyer: ${order.buyer}</p>
          </div>
          <div class="text-right">
            <span class="text-xs text-gray-400 block">Total Contract Value</span>
            <span class="text-2xl font-black text-deep-forest font-mono">${order.totalAmount}</span>
            <span class="text-xs text-gray-500 block">Volume: ${order.quantity}</span>
          </div>
        </div>

        <!-- Milestone Progress Bar -->
        <div>
          <div class="flex justify-between text-xs font-semibold text-gray-600 mb-1.5">
            <span>Milestone: ${order.currentMilestone}</span>
            <span>${order.progressPercent}% Complete</span>
          </div>
          <div class="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
            <div class="bg-primary h-full rounded-full transition-all duration-700" style="width: ${order.progressPercent}%"></div>
          </div>
        </div>

        <!-- Logistics & Escrow Details -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
          <div>
            <span class="text-gray-400 block text-[11px]">Escrow Status</span>
            <strong class="text-emerald-900 flex items-center gap-1">
              <span class="material-symbols-outlined text-xs text-emerald-600">lock</span> ${order.escrowStatus}
            </strong>
          </div>
          <div>
            <span class="text-gray-400 block text-[11px]">Quality Certificate</span>
            <strong class="text-emerald-900 truncate block">${order.qualityCertificate}</strong>
          </div>
          <div>
            <span class="text-gray-400 block text-[11px]">ETA Delivery</span>
            <strong class="text-emerald-900">${order.eta}</strong>
          </div>
        </div>

        <!-- Order Actions -->
        <div class="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-gray-100">
          <span class="text-xs text-gray-500 font-mono">Carrier: ${order.carrier}</span>
          <div class="flex gap-2">
            <button onclick="downloadMockInvoice('${order.orderId}')" class="px-3.5 py-1.5 btn-elite-secondary text-xs font-semibold">
              <span class="material-symbols-outlined text-xs">receipt_long</span> Invoice PDF
            </button>
            <button onclick="showToast('Assay Lab Report', 'NABL Lab Certificate verification passed 100%. Download link generated.', 'success')" class="px-3.5 py-1.5 btn-elite-secondary text-xs font-semibold">
              <span class="material-symbols-outlined text-xs">verified</span> Assay Report
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderFarmerLots() {
  const container = document.getElementById('farmer-lots-table');
  if (!container || !window.FIELDORA_DATA) return;

  const lots = window.FIELDORA_DATA.farmerLots;
  container.innerHTML = lots.map((lot, idx) => `
    <tr class="border-b border-gray-100 hover:bg-slate-50/70 transition-colors">
      <td class="py-4 px-4 font-mono font-bold text-primary text-xs">${lot.lotId}</td>
      <td class="py-4 px-4 font-bold text-deep-forest text-sm">${lot.crop} <span class="text-xs font-normal text-gray-400 block">${lot.storageLocation}</span></td>
      <td class="py-4 px-4 font-mono text-sm">${lot.harvestYield}</td>
      <td class="py-4 px-4 font-mono font-bold text-emerald-800 text-sm">${lot.pricePerQtl}</td>
      <td class="py-4 px-4">
        <span class="text-xs font-semibold text-deep-forest">${lot.topBid}</span>
        <span class="text-[11px] text-gray-400 block">${lot.bidsReceived} institutional bids</span>
      </td>
      <td class="py-4 px-4">
        <span class="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">${lot.status}</span>
      </td>
      <td class="py-4 px-4 text-right">
        <button onclick="showToast('Accepting Bid', 'Bid accepted! Smart contract & Escrow escrow generation in progress.', 'success')" class="px-3 py-1 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-deep-forest transition-colors">
          Accept Top Bid
        </button>
      </td>
    </tr>
  `).join('');
}

function renderAssetListings() {
  const container = document.getElementById('asset-grid-container');
  if (!container || !window.FIELDORA_DATA) return;

  const assets = window.FIELDORA_DATA.assets;
  container.innerHTML = assets.map(asset => `
    <div class="glass-card-elite rounded-2xl overflow-hidden flex flex-col justify-between">
      <div>
        <div class="h-48 overflow-hidden relative">
          <img src="${asset.image}" alt="${asset.title}" class="w-full h-full object-cover">
          <span class="absolute top-3 left-3 px-3 py-1 bg-black/75 backdrop-blur-md text-white text-xs font-bold rounded-lg">${asset.category}</span>
          <span class="absolute bottom-3 right-3 px-2.5 py-1 bg-emerald-600/90 text-white text-xs font-semibold rounded-md">${asset.availability}</span>
        </div>
        <div class="p-5">
          <h3 class="font-bold text-lg text-deep-forest mb-1">${asset.title}</h3>
          <p class="text-xs text-gray-500 flex items-center gap-1 mb-3">
            <span class="material-symbols-outlined text-sm">location_on</span> ${asset.location} • Provider: ${asset.owner}
          </p>

          <div class="space-y-1.5 mb-4">
            ${asset.features.map(f => `<div class="text-xs text-gray-600 flex items-center gap-1.5"><span class="material-symbols-outlined text-xs text-primary">check_circle</span> ${f}</div>`).join('')}
          </div>
        </div>
      </div>

      <div class="p-5 pt-0 border-t border-gray-100 flex items-center justify-between">
        <div>
          <span class="text-xs text-gray-400 block">Rental Tariff</span>
          <span class="font-black text-xl text-primary font-mono">${asset.rate}</span>
        </div>
        <button onclick="bookAssetPrompt('${asset.title}')" class="py-2 px-4 btn-elite-primary text-xs font-semibold">
          Book Lease
        </button>
      </div>
    </div>
  `).join('');
}

function downloadMockInvoice(orderId) {
  showToast('Generating Invoice', `Tax Invoice for ${orderId} downloaded successfully.`, 'success');
}

function bookAssetPrompt(assetTitle) {
  showToast('Booking Request Sent', `Your lease reservation request for "${assetTitle}" has been sent to the cooperative coordinator.`, 'success');
}

/* -------------------------------------------------------------
 * 8. Form Submissions & Modals
 * ------------------------------------------------------------- */
function initForms() {
  // RFQ Submission Form
  const rfqForm = document.getElementById('post-rfq-form');
  if (rfqForm) {
    rfqForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const commodity = document.getElementById('rfq-commodity').value;
      const quantity = document.getElementById('rfq-quantity').value;
      const targetPrice = document.getElementById('rfq-target-price').value;
      const location = document.getElementById('rfq-destination').value;

      showToast('RFQ Published Live', `Your tender for ${quantity} MT of ${commodity} @ ₹${targetPrice}/Qtl has been published across 40+ FPO networks.`, 'success');
      
      rfqForm.reset();
      navigateTo('order-history');
    });
  }

  // Farmer New Produce Form
  const produceForm = document.getElementById('add-produce-form');
  if (produceForm) {
    produceForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('new-prod-name').value;
      const category = document.getElementById('new-prod-category').value;
      const price = parseFloat(document.getElementById('new-prod-price').value);
      const qty = parseInt(document.getElementById('new-prod-qty').value);
      const location = document.getElementById('new-prod-location').value;

      const newId = `PROD-${Math.floor(100 + Math.random() * 900)}`;

      
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

        window.FIELDORA_DATA.produceItems.unshift({
        id: newId,
        name: name,
        category: category.charAt(0).toUpperCase() + category.slice(1),
        categoryKey: category.toLowerCase(),
        grade: "Grade A+ Certified",
        variety: "Hybrid Standard",
        isElite: true,
        isOrganic: true,
        pricePerQtl: price,
        minOrderQtl: 50,
        availableQtl: qty,
        location: location,
        farmName: "Rajendra Patel & Associates FPO",
        farmerName: "Rajendra Patel",
        farmerRating: 5.0,
        farmerDeals: 1,
        moisture: "9.0%",
        proteinContent: "13.5%",
        harvestDate: "Feb 2026",
        certifications: ["India Organic", "Fieldora QA"],
        image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80",
        description: `Newly listed farm batch of ${name} ready for immediate dispatch and laboratory assay inspection.`
      });

      renderMarketplace();
      closeNewProduceModal();
      showToast('Lot Listed Successfully', `${name} (${qty} Qtl) is now live on the marketplace.`, 'success');
      navigateTo('my-produce');
    });
  }

  // Login Form
  const loginForm = document.getElementById('login-auth-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const role = document.getElementById('login-role-select').value || 'buyer';
      setRole(role);
      closeLoginModal();
    });
  }
}

function initModalsAndDrawers() {
  // Global backdrop clicks
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.classList.add('hidden');
      }
    });
  });
}

function openNewProduceModal() {
  const modalEl = document.getElementById('new-produce-modal');
  if (modalEl) modalEl.classList.remove('hidden');
}

function closeNewProduceModal() {
  const modalEl = document.getElementById('new-produce-modal');
  if (modalEl) modalEl.classList.add('hidden');
}

function openLoginModal() {
  const modalEl = document.getElementById('login-modal');
  if (modalEl) modalEl.classList.remove('hidden');
}

function closeLoginModal() {
  const modalEl = document.getElementById('login-modal');
  if (modalEl) modalEl.classList.add('hidden');
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobile-nav-menu');
  if (menu) menu.classList.toggle('hidden');
}

function closeMobileMenu() {
  const menu = document.getElementById('mobile-nav-menu');
  if (menu) menu.classList.add('hidden');
}

/* -------------------------------------------------------------
 * 9. Toast Notification System
 * ------------------------------------------------------------- */
function showToast(title, message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast-item';

  let iconName = 'info';
  let iconColor = 'text-primary';

  if (type === 'success') {
    iconName = 'check_circle';
    iconColor = 'text-emerald-600';
  } else if (type === 'warning') {
    iconName = 'warning';
    iconColor = 'text-amber-600';
  } else if (type === 'error') {
    iconName = 'error';
    iconColor = 'text-red-600';
  }

  toast.innerHTML = `
    <span class="material-symbols-outlined ${iconColor} text-2xl">${iconName}</span>
    <div class="flex-1">
      <h4 class="font-bold text-xs text-deep-forest uppercase tracking-wider">${title}</h4>
      <p class="text-xs text-gray-600 mt-0.5">${message}</p>
    </div>
    <button onclick="this.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
      <span class="material-symbols-outlined text-sm">close</span>
    </button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

// Global scope attachments for inline HTML onclick handlers
window.navigateTo = navigateTo;
window.setRole = setRole;
window.openProduceModal = openProduceModal;
window.closeProduceModal = closeProduceModal;
window.addToRFQCart = addToRFQCart;
window.openCartDrawer = openCartDrawer;
window.closeCartDrawer = closeCartDrawer;
window.removeCartItem = removeCartItem;
window.submitRFQFromCart = submitRFQFromCart;
window.directOrderPrompt = directOrderPrompt;
window.setForecastCrop = setForecastCrop;
window.downloadMockInvoice = downloadMockInvoice;
window.bookAssetPrompt = bookAssetPrompt;
window.openNewProduceModal = openNewProduceModal;
window.closeNewProduceModal = closeNewProduceModal;
window.openLoginModal = openLoginModal;
window.closeLoginModal = closeLoginModal;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.resetMarketplaceFilters = resetMarketplaceFilters;
window.showToast = showToast;

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
  
  grid.innerHTML = window.FIELDORA_DATA.produceItems.map(item => `
    <div class="ref-card overflow-hidden flex flex-col justify-between">
      <div>
        <img src="${item.image}" alt="${item.name}" class="w-full h-40 object-cover" />
        <div class="p-4 space-y-2">
          <div class="flex justify-between items-baseline">
            <h4 class="font-bold text-base text-deep-forest">${item.name}</h4>
            <span class="font-mono font-bold text-deep-forest">₹${item.price}/q</span>
          </div>
          <div class="text-xs text-secondary-text">${item.qty} Quintals • Grade A • Harvest: ${item.harvestDate}</div>
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
  `).join('');
  
  // Also update the sidebar count
  const produceTab = document.getElementById('f-tab-produce');
  if (produceTab) {
    produceTab.innerHTML = `<i data-lucide="leaf" class="w-5 h-5"></i> My Produce Lots (${window.FIELDORA_DATA.produceItems.length})`;
    lucide.createIcons();
  }
};

// OVERRIDE the inline handleFarmerListProduce function from index.html
window.handleFarmerListProduceAsync = async function(e) {
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

