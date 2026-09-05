// Fieldora Platform Central Data Store
const FIELDORA_DATA = {
  // Live Mandi Ticker Data
  mandiTicker: [
    { commodity: "Sharbati Wheat (Grade A)", mandi: "Indore APMC", price: "₹2,680/Qtl", change: "+3.2%", trend: "up" },
    { commodity: "Basmati 1121 Paddy", mandi: "Karnal Mandi", price: "₹4,150/Qtl", change: "+1.8%", trend: "up" },
    { commodity: "Yellow Soybean (Moist <9%)", mandi: "Ujjain APMC", price: "₹4,720/Qtl", change: "-0.6%", trend: "down" },
    { commodity: "Mustard Seed (Oil 42%)", mandi: "Jaipur APMC", price: "₹5,440/Qtl", change: "+2.4%", trend: "up" },
    { commodity: "Jeera / Cumin (Premium)", mandi: "Unjha Mandi", price: "₹26,800/Qtl", change: "+4.5%", trend: "up" },
    { commodity: "Teja Red Chilli (Export)", mandi: "Guntur APMC", price: "₹18,200/Qtl", change: "-1.1%", trend: "down" },
    { commodity: "Long Staple Cotton (29mm)", mandi: "Rajkot APMC", price: "₹6,150/Qtl", change: "+0.9%", trend: "up" },
    { commodity: "Tur / Arhar Dal (Grade A)", mandi: "Gulbarga APMC", price: "₹9,850/Qtl", change: "+1.5%", trend: "up" },
    { commodity: "Arabica Green Coffee", mandi: "Chikkamagaluru", price: "₹340/Kg", change: "+5.0%", trend: "up" }
  ],

  // Platform Metrics
  stats: {
    totalTradeVolume: "₹480+ Cr",
    verifiedProducers: "12,400+",
    corporateBuyers: "850+",
    onTimeDeliveryRate: "99.4%",
    avgFarmerPriceHike: "+18.2%",
    totalMTReductionInWaste: "34,000 MT"
  },

  // Produce Catalog Items
  produceItems: [
    {
      id: "PROD-101",
      name: "Organic Sharbati Wheat (MP Origin)",
      category: "Grains",
      categoryKey: "grains",
      grade: "Grade A+ Export",
      variety: "Sharbati C-306",
      isElite: true,
      isOrganic: true,
      pricePerQtl: 2750,
      minOrderQtl: 100,
      availableQtl: 2400,
      location: "Sehore, Madhya Pradesh",
      farmName: "Narmada Golden Fields FPO",
      farmerName: "Rajendra Patel",
      farmerRating: 4.9,
      farmerDeals: 42,
      moisture: "9.2%",
      proteinContent: "13.8%",
      harvestDate: "March 2026",
      certifications: ["India Organic", "NPOP", "FSSAI Platinum"],
      image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80",
      description: "Direct-from-farm Golden Sharbati wheat grown along the fertile Narmada basin. High gluten strength, lustrous grain color, with verified moisture below 9.5% tested in NABL certified laboratory."
    },
    {
      id: "PROD-102",
      name: "Basmati Rice 1121 Extra Long Grain",
      category: "Grains",
      categoryKey: "grains",
      grade: "Export Platinum",
      variety: "Pusa 1121 Aged 2 Yrs",
      isElite: true,
      isOrganic: false,
      pricePerQtl: 4250,
      minOrderQtl: 200,
      availableQtl: 5800,
      location: "Taraori, Karnal, Haryana",
      farmName: "Karnal Agritech Producer Co.",
      farmerName: "Gurpreet Singh",
      farmerRating: 5.0,
      farmerDeals: 78,
      moisture: "10.4%",
      grainLength: "8.35 mm (Pre-cooked)",
      harvestDate: "Nov 2025",
      certifications: ["GlobalGAP", "ISO 22000", "APEDA Registered"],
      image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
      description: "Naturally aged Basmati rice with exquisite aroma and elongation ratio of 2.5x. Stored in climate-controlled silos with complete traceability from seed germination to harvest."
    },
    {
      id: "PROD-103",
      name: "High-Oil Black Mustard Seed",
      category: "Oilseeds",
      categoryKey: "oilseeds",
      grade: "Grade A",
      variety: "Pusa Bold (Oil 42.8%)",
      isElite: false,
      isOrganic: true,
      pricePerQtl: 5480,
      minOrderQtl: 50,
      availableQtl: 1650,
      location: "Bharatpur, Rajasthan",
      farmName: "Braj Agro Cooperative",
      farmerName: "Mukesh Sharma",
      farmerRating: 4.8,
      farmerDeals: 29,
      moisture: "7.8%",
      oilContent: "42.8%",
      harvestDate: "Feb 2026",
      certifications: ["Jaivik Bharat", "NABL Lab Tested"],
      image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80",
      description: "High oil content mustard seeds cultivated with zero synthetic pesticides. Excellent pungency and cold-pressing yield for premium edible oil refineries."
    },
    {
      id: "PROD-104",
      name: "Non-GMO Yellow Soybean (Protein 40%)",
      category: "Oilseeds",
      categoryKey: "oilseeds",
      grade: "Industrial Grade A",
      variety: "JS-9560",
      isElite: true,
      isOrganic: false,
      pricePerQtl: 4790,
      minOrderQtl: 150,
      availableQtl: 7200,
      location: "Dewas, Madhya Pradesh",
      farmName: "Malwa Soy Cluster",
      farmerName: "Dinesh Choudhary",
      farmerRating: 4.9,
      farmerDeals: 65,
      moisture: "8.5%",
      proteinContent: "40.2%",
      harvestDate: "Oct 2025",
      certifications: ["Non-GMO Verified", "GMP+ Feed Certified"],
      image: "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=800&q=80",
      description: "Cleaned and sorted non-GMO yellow soybeans with uniform kernel size, optimal for tofu manufacturing, plant protein extraction, and solvent extraction plants."
    },
    {
      id: "PROD-105",
      name: "Unjha Premium Bold Cumin (Jeera)",
      category: "Spices",
      categoryKey: "spices",
      grade: "Machine Clean 99.5%",
      variety: "Gujarat Cumin-4",
      isElite: true,
      isOrganic: true,
      pricePerQtl: 27200,
      minOrderQtl: 20,
      availableQtl: 480,
      location: "Unjha, Mehsana, Gujarat",
      farmName: "Saurashtra Spice Collective",
      farmerName: "Bhavin Patel",
      farmerRating: 5.0,
      farmerDeals: 53,
      moisture: "7.1%",
      purity: "99.5%",
      harvestDate: "March 2026",
      certifications: ["Spice Board Certified", "USDA Organic", "EU Residue Compliant"],
      image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80",
      description: "Sun-dried bold aroma cumin seeds free from dust and extraneous matter. Rigorously tested for aflatoxins and heavy metals to meet international EU and US FDA export benchmarks."
    },
    {
      id: "PROD-106",
      name: "Guntur Sannam S4 Dry Red Chilli",
      category: "Spices",
      categoryKey: "spices",
      grade: "Stemless A-Grade",
      variety: "S4 Sannam (SHU 35,000)",
      isElite: false,
      isOrganic: false,
      pricePerQtl: 18500,
      minOrderQtl: 30,
      availableQtl: 920,
      location: "Guntur, Andhra Pradesh",
      farmName: "Krishna Delta Spice FPO",
      farmerName: "Srinivasa Rao",
      farmerRating: 4.7,
      farmerDeals: 37,
      moisture: "9.8%",
      colorValue: "110 ASTA",
      harvestDate: "Jan 2026",
      certifications: ["Spice Board India", "FSSAI Certified"],
      image: "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=800&q=80",
      description: "High pungency, deep red natural color dry chillies with stems removed. Ideal for oleoresin extraction, curry paste formulations, and institutional bulk spice blending."
    },
    {
      id: "PROD-107",
      name: "BT Shankar-6 Raw Cotton Bales",
      category: "Cash Crops",
      categoryKey: "cash-crops",
      grade: "Spun Quality Super",
      variety: "Shankar-6 (Staple 29.5mm)",
      isElite: true,
      isOrganic: false,
      pricePerQtl: 6280,
      minOrderQtl: 100,
      availableQtl: 4500,
      location: "Rajkot, Gujarat",
      farmName: "Kathiawar Ginning & Farmer Producer Co.",
      farmerName: "Kishorebhai Bhalala",
      farmerRating: 4.9,
      farmerDeals: 91,
      moisture: "7.4%",
      micronaire: "3.9 - 4.2",
      harvestDate: "Dec 2025",
      certifications: ["Cotton Corporation of India Verified", "OEKO-TEX Std"],
      image: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=800&q=80",
      description: "Low-trash, uniform staple length cotton bales pressed under hydraulic standards. High tensile strength and elongation suitable for 30s to 50s combed yarn spinning."
    },
    {
      id: "PROD-108",
      name: "Organic Whole Tur / Pigeon Pea Dal",
      category: "Pulses",
      categoryKey: "pulses",
      grade: "Grade A Unpolished",
      variety: "Maruti (ICP 8863)",
      isElite: false,
      isOrganic: true,
      pricePerQtl: 9950,
      minOrderQtl: 40,
      availableQtl: 1200,
      location: "Kalaburagi (Gulbarga), Karnataka",
      farmName: "Kalyana Karnataka Agro Producers",
      farmerName: "Basavaraj Patil",
      farmerRating: 4.8,
      farmerDeals: 31,
      moisture: "9.0%",
      proteinContent: "22.6%",
      harvestDate: "Jan 2026",
      certifications: ["India Organic", "PGS-India Green"],
      image: "https://images.unsplash.com/photo-1585994192701-f1e507c815ee?auto=format&fit=crop&w=800&q=80",
      description: "Traditional GI-tagged Gulbarga Tur with natural nutty taste. Unpolished and unadulterated, retaining complete dietary fibers and micronutrients."
    },
    {
      id: "PROD-109",
      name: "Wayanad Single-Origin Green Cardamom",
      category: "Spices",
      categoryKey: "spices",
      grade: "8mm Jumbo Bold",
      variety: "Njallani High-Yield",
      isElite: true,
      isOrganic: true,
      pricePerQtl: 245000,
      minOrderQtl: 5,
      availableQtl: 180,
      location: "Wayanad, Kerala",
      farmName: "Western Ghats Spice Reserve",
      farmerName: "Mathew Thomas",
      farmerRating: 5.0,
      farmerDeals: 64,
      moisture: "8.2%",
      essentialOil: "8.5 ml/100g",
      harvestDate: "Feb 2026",
      certifications: ["Rainforest Alliance", "USDA Organic", "GI Tagged"],
      image: "https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=800&q=80",
      description: "Intensely aromatic 8mm+ emerald green cardamom pods handpicked from shade-grown mist valley plantations. Retains natural oils through precision wood-fired curing."
    }
  ],

  // Market Intelligence Forecast Data
  forecastTrends: {
    wheat: {
      name: "Sharbati Wheat",
      historical: [2480, 2520, 2580, 2620, 2680],
      forecast: [2720, 2790, 2850, 2910],
      labels: ["Nov 25", "Dec 25", "Jan 26", "Feb 26", "Mar 26 (Current)", "Apr 26 (Est)", "May 26 (Est)", "Jun 26 (Est)", "Jul 26 (Est)"],
      expectedPeak: "June 2026 (₹2,910/Qtl)",
      volatilityIndex: "Low (4.2%)",
      procurementSignal: "STRONG BUY (Pre-Monsoon Storage)",
      driverSummary: "Export demand rebound from GCC & lower buffer stock carryover in northern silos."
    },
    basmati: {
      name: "Basmati 1121",
      historical: [3850, 3920, 4020, 4080, 4150],
      forecast: [4220, 4300, 4380, 4420],
      labels: ["Nov 25", "Dec 25", "Jan 26", "Feb 26", "Mar 26 (Current)", "Apr 26 (Est)", "May 26 (Est)", "Jun 26 (Est)", "Jul 26 (Est)"],
      expectedPeak: "July 2026 (₹4,420/Qtl)",
      volatilityIndex: "Medium (7.8%)",
      procurementSignal: "ACCUMULATE",
      driverSummary: "Tight inventory in Punjab/Haryana mandis coupled with rising ocean freight rates."
    },
    soybean: {
      name: "Yellow Soybean",
      historical: [5100, 4980, 4850, 4780, 4720],
      forecast: [4680, 4710, 4820, 4950],
      labels: ["Nov 25", "Dec 25", "Jan 26", "Feb 26", "Mar 26 (Current)", "Apr 26 (Est)", "May 26 (Est)", "Jun 26 (Est)", "Jul 26 (Est)"],
      expectedPeak: "August 2026 (₹4,950/Qtl)",
      volatilityIndex: "High (11.4%)",
      procurementSignal: "WAIT & BUY ON DIPS",
      driverSummary: "Record South American crop arrivals putting short-term pressure on domestic crush margins."
    }
  },

  // Active Buyer Contracts & Orders
  orders: [
    {
      orderId: "FLD-ORD-88219",
      buyer: "ITC Agri-Business Division",
      seller: "Narmada Golden Fields FPO",
      produce: "Organic Sharbati Wheat",
      quantity: "500 Qtl (50 MT)",
      totalAmount: "₹13,75,000",
      status: "In Transit",
      progressPercent: 75,
      currentMilestone: "GPS Tracking: En Route to Warehouse #4, Nagpur",
      eta: "Tomorrow, 04:30 PM",
      escrowStatus: "100% Funded (₹13.75L in Escrow)",
      qualityCertificate: "NABL-2026-QC-9941 (Passed - 99.4% Purity)",
      carrier: "Fieldora ColdChain Express (Vehicle: MP-09-GH-4122)",
      timeline: [
        { title: "Contract Executed & Digitally Signed", time: "24 Feb 2026, 11:20 AM", done: true },
        { title: "Escrow Deposit Confirmed by Buyer", time: "25 Feb 2026, 09:15 AM", done: true },
        { title: "Quality Inspection & Assay Certified", time: "26 Feb 2026, 03:45 PM", done: true },
        { title: "Dispatched from Sehore Silo Hub", time: "27 Feb 2026, 07:00 AM", done: true },
        { title: "Warehouse Delivery & Final Inspection", time: "Estimated: 28 Feb 2026, 04:30 PM", done: false }
      ]
    },
    {
      orderId: "FLD-ORD-88194",
      buyer: "Adani Wilmar Consumer Goods",
      seller: "Braj Agro Cooperative",
      produce: "High-Oil Black Mustard Seed",
      quantity: "350 Qtl (35 MT)",
      totalAmount: "₹19,18,000",
      status: "Quality Inspection",
      progressPercent: 45,
      currentMilestone: "Assay verification in progress at Alwar Testing Lab",
      eta: "02 March 2026",
      escrowStatus: "100% Funded",
      qualityCertificate: "In Assay Testing (Moisture & Oil Content)",
      carrier: "Fieldora Verified Logistics Partner",
      timeline: [
        { title: "Contract Executed", time: "26 Feb 2026, 02:10 PM", done: true },
        { title: "Escrow Deposit Received", time: "26 Feb 2026, 04:30 PM", done: true },
        { title: "Fieldora QA Team On-site Inspection", time: "27 Feb 2026, 10:00 AM", done: true },
        { title: "Dispatch & Seal Loading", time: "Pending QA Signoff", done: false },
        { title: "Delivery to Refinery", time: "Est: 02 March 2026", done: false }
      ]
    },
    {
      orderId: "FLD-ORD-88042",
      buyer: "Haldiram Snacks Pvt Ltd",
      seller: "Saurashtra Spice Collective",
      produce: "Unjha Premium Bold Cumin (Jeera)",
      quantity: "80 Qtl (8 MT)",
      totalAmount: "₹21,76,000",
      status: "Completed",
      progressPercent: 100,
      currentMilestone: "Delivered & Funds Released to Farmer FPO",
      eta: "Delivered on 22 Feb",
      escrowStatus: "Settled (₹21.76L Released)",
      qualityCertificate: "NABL-SPICE-8812 (Passed - 99.8% Clean)",
      carrier: "Dedicated Logistics",
      timeline: [
        { title: "Contract Executed", time: "18 Feb 2026", done: true },
        { title: "Escrow Deposit", time: "18 Feb 2026", done: true },
        { title: "Quality Assay Cleared", time: "19 Feb 2026", done: true },
        { title: "Dispatched", time: "20 Feb 2026", done: true },
        { title: "Delivered & Payout Executed", time: "22 Feb 2026", done: true }
      ]
    }
  ],

  // Farmer Inventory Lots
  farmerLots: [
    {
      lotId: "LOT-MP-902",
      crop: "Sharbati Wheat (C-306)",
      harvestYield: "850 Qtl",
      pricePerQtl: "₹2,750",
      bidsReceived: 6,
      topBid: "₹2,780/Qtl (ITC Ltd)",
      status: "Active Bidding",
      storageLocation: "Silo #2, Sehore Agritech Hub",
      moisture: "9.2%",
      cert: "India Organic"
    },
    {
      lotId: "LOT-MP-844",
      crop: "Yellow Soybean (JS-9560)",
      harvestYield: "1,200 Qtl",
      pricePerQtl: "₹4,790",
      bidsReceived: 3,
      topBid: "₹4,750/Qtl (Ruchi Soya)",
      status: "Contract Under Review",
      storageLocation: "Dewas Warehouse Hub",
      moisture: "8.5%",
      cert: "Non-GMO"
    },
    {
      lotId: "LOT-MP-791",
      crop: "Chana Dal (Desi Chickpea)",
      harvestYield: "400 Qtl",
      pricePerQtl: "₹6,100",
      bidsReceived: 8,
      topBid: "₹6,220/Qtl (Tata Sampann)",
      status: "Sold & In Logistics",
      storageLocation: "Indore Central Logistics",
      moisture: "9.0%",
      cert: "Verified NABL"
    }
  ],

  // Agricultural Assets & Equipment Hub
  assets: [
    {
      id: "EQ-101",
      title: "John Deere 5310 4WD Smart Tractor",
      category: "Machinery",
      power: "55 HP Turbocharged",
      rate: "₹950 / Hour",
      location: "Karnal, Haryana",
      availability: "Instant / Available Today",
      features: ["GPS Precision Steering", "Laser Leveler Attachment", "AC Cabin", "Real-time Telematics"],
      image: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80",
      owner: "Haryana Krishi Yantra Cooperative"
    },
    {
      id: "EQ-102",
      title: "Preet Multi-Crop Combine Harvester",
      category: "Machinery",
      power: "101 HP Heavy Duty",
      rate: "₹2,200 / Acre",
      location: "Indore / Ujjain Belt, MP",
      availability: "Booking Open for Rabi Harvest",
      features: ["Grain Loss <1.2%", "Straw Reaper Compatible", "High Grain Tank Capacity (2,200 L)", "24x7 Operator Included"],
      image: "https://images.unsplash.com/photo-1594771804886-a933bb2d609b?auto=format&fit=crop&w=800&q=80",
      owner: "Malwa Agri Rental Services"
    },
    {
      id: "EQ-103",
      title: "500 MT Solar Climate-Controlled Cold Storage",
      category: "Storage",
      power: "100% Solar Powered + Grid Backup",
      rate: "₹180 / Quintal / Month",
      location: "Nashik, Maharashtra",
      availability: "180 MT Capacity Free",
      features: ["Ethylene Scrubbers", "IoT Temp & Humidity Alarms (0°C to 12°C)", "Fumigation On Demand", "Warehouse Receipt Financing"],
      image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
      owner: "Sahyadri Cold Chain Infrastructure"
    },
    {
      id: "EQ-104",
      title: "Netafim Automated Drip Fertigation Rig",
      category: "Irrigation",
      power: "Smart IoT Controller",
      rate: "₹12,000 / Season Lease",
      location: "Guntur, Andhra Pradesh",
      availability: "Available for Immediate Dispatch",
      features: ["Automated NPK Dosing", "Soil Moisture Telemetry", "40% Water Savings", "App Monitored"],
      image: "https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&w=800&q=80",
      owner: "Andhra Precision Farming Hub"
    }
  ],

  // Testimonials & Case Studies
  testimonials: [
    {
      quote: "Fieldora cut our procurement cycle from 14 days down to 36 hours. The batch transparency, lab assay reports, and automated escrow made direct sourcing from 40 FPOs effortless.",
      author: "Venkatesh Raman",
      designation: "Head of Agri-Sourcing, Premium FMCG Foods",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80"
    },
    {
      quote: "Before Fieldora, middlemen took 15-20% margin while we absorbed the market crash risk. Now, we receive advance price alerts, get direct institutional bids, and our money hits our account within 2 hours of delivery.",
      author: "Sardar Baljit Singh",
      designation: "President, Malwa Progressive Farmers Producer Co.",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80"
    }
  ]
};

// Export to window for global browser access
window.FIELDORA_DATA = FIELDORA_DATA;
