import { ParsedSearchQuery, AIAssistantMessage } from '../types';
import { MOCK_MARKET_PRICES, MOCK_REQUIREMENTS, MOCK_PRODUCE, MOCK_ORDERS } from '../data/mockData';

/**
 * Natural Language Query Parser for Buyer Search
 * Interprets phrases like: "I need 500 kg Grade A tomatoes near Mumbai under ₹3,000/q"
 */
export function parseNaturalLanguageQuery(query: string): ParsedSearchQuery {
  const lower = query.toLowerCase();
  const result: ParsedSearchQuery = { rawQuery: query };

  // Crop detection
  if (lower.includes('tomato')) result.crop = 'Tomato';
  else if (lower.includes('onion')) result.crop = 'Onion';
  else if (lower.includes('potato')) result.crop = 'Potato';
  else if (lower.includes('wheat')) result.crop = 'Wheat';
  else if (lower.includes('rice') || lower.includes('basmati')) result.crop = 'Rice';
  else if (lower.includes('soybean') || lower.includes('soya')) result.crop = 'Soybean';

  // Quantity detection (e.g. 500 kg, 1 ton, 50 qtl, 50 quintals)
  const qtyMatch = query.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(kg|quintal|qtl|ton|tons|quintals|q)/i);
  if (qtyMatch) {
    const rawVal = parseFloat(qtyMatch[1].replace(/,/g, ''));
    const unit = qtyMatch[2].toLowerCase();
    if (unit.startsWith('ton')) {
      result.quantity = rawVal * 10; // 1 ton = 10 quintals
      result.unit = 'quintal (from ' + rawVal + ' tons)';
    } else if (unit === 'kg') {
      result.quantity = Math.round(rawVal / 100); // 100 kg = 1 quintal
      result.unit = `${rawVal} kg`;
    } else {
      result.quantity = rawVal;
      result.unit = 'quintal';
    }
  }

  // Quality detection
  if (lower.includes('grade a+') || lower.includes('grade a plus')) result.quality = 'Grade A+';
  else if (lower.includes('grade a') || lower.includes('export')) result.quality = 'Grade A';
  else if (lower.includes('grade b')) result.quality = 'Grade B';

  // Location detection
  const locations = ['mumbai', 'nashik', 'pune', 'vashi', 'lasalgaon', 'indore', 'karnal', 'nagpur', 'delhi'];
  for (const loc of locations) {
    if (lower.includes(loc)) {
      result.location = loc.charAt(0).toUpperCase() + loc.slice(1);
      break;
    }
  }

  // Price detection (e.g. under 3000, under ₹3,000, below 2500, max 2800)
  const priceMatch = query.match(/(?:under|below|less than|max|up to|₹|rs\.?)\s*(\d+(?:,\d+)?)/i);
  if (priceMatch) {
    result.maxPrice = parseInt(priceMatch[1].replace(/,/g, ''), 10);
  }

  return result;
}

/**
 * AI-Assisted Requirement Extractor
 * Interprets: "I need 1 ton Grade A potatoes in Mumbai by 20 September. My target price is ₹2,200/q."
 */
export function extractRequirementFromPrompt(prompt: string) {
  const parsed = parseNaturalLanguageQuery(prompt);
  
  // Extract date if present
  let requiredBy = '2026-09-20';
  if (prompt.toLowerCase().includes('september') || prompt.toLowerCase().includes('sept')) {
    const dayMatch = prompt.match(/(\d{1,2})\s*(?:th|st|nd|rd)?\s*(?:sept|september)/i);
    if (dayMatch) {
      const day = dayMatch[1].padStart(2, '0');
      requiredBy = `2026-09-${day}`;
    }
  }

  return {
    crop: parsed.crop || 'Potato',
    variety: parsed.crop === 'Potato' ? 'Kufri Jyoti / Table' : 'Standard Hybrid',
    quantity: parsed.quantity || 10,
    unit: 'quintal' as const,
    targetPrice: parsed.maxPrice || 2200,
    qualityRequirements: (parsed.quality || 'Grade A') as any,
    deliveryLocation: parsed.location ? `${parsed.location} Central Hub` : 'Mumbai Facility',
    requiredByDate: requiredBy,
    paymentTerms: '100% Escrow deposit upon contract confirmation'
  };
}

/**
 * Assistant Response Engine (Context-aware responses)
 */
export function getAssistantResponse(query: string, userRole: 'farmer' | 'buyer'): AIAssistantMessage {
  const lower = query.toLowerCase();
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. Market Price Queries
  if (lower.includes('price') || lower.includes('rate') || lower.includes('mandi') || lower.includes('tomato price') || lower.includes('onion price')) {
    const cropMatch = lower.includes('onion') ? 'Onion' : lower.includes('potato') ? 'Potato' : 'Tomato';
    const priceData = MOCK_MARKET_PRICES.find(p => p.crop.toLowerCase() === cropMatch.toLowerCase()) || MOCK_MARKET_PRICES[0];
    
    return {
      id: 'msg-' + Date.now(),
      sender: 'assistant',
      timestamp,
      content: `Here is the verified APMC Mandi reference for **${priceData.crop}**:`,
      structuredData: {
        type: 'market_price',
        data: priceData
      },
      suggestedActions: [
        'Compare nearby markets',
        'Find verified buyers',
        'View 30-day price trend'
      ]
    };
  }

  // 2. Finding Buyers (Farmer side)
  if (lower.includes('find buyer') || lower.includes('buyers') || lower.includes('matching buyer')) {
    return {
      id: 'msg-' + Date.now(),
      sender: 'assistant',
      timestamp,
      content: `Found **${MOCK_REQUIREMENTS.length} active verified institutional buyer requirements** matching your regional harvest capacity:`,
      structuredData: {
        type: 'buyer_matches',
        data: MOCK_REQUIREMENTS
      },
      suggestedActions: [
        'View 94% match requirement',
        'List new harvest lot',
        'Check pending purchase requests'
      ]
    };
  }

  // 3. Finding Produce (Buyer side)
  if (lower.includes('find produce') || lower.includes('buy') || lower.includes('search produce') || lower.includes('500kg')) {
    return {
      id: 'msg-' + Date.now(),
      sender: 'assistant',
      timestamp,
      content: `Here are available verified harvest lots ready for immediate farm-gate dispatch:`,
      structuredData: {
        type: 'produce_list',
        data: MOCK_PRODUCE.slice(0, 3)
      },
      suggestedActions: [
        'Filter by Grade A+',
        'View Nashik Tomato lot',
        'Create customized requirement'
      ]
    };
  }

  // 4. Pending Orders
  if (lower.includes('order') || lower.includes('pending') || lower.includes('track')) {
    return {
      id: 'msg-' + Date.now(),
      sender: 'assistant',
      timestamp,
      content: `You have **${MOCK_ORDERS.length} active orders** currently in progress with guaranteed escrow security:`,
      structuredData: {
        type: 'order_summary',
        data: MOCK_ORDERS
      },
      suggestedActions: [
        'Track GPS shipment #FD-1042',
        'Download assay report',
        'View completed deliveries'
      ]
    };
  }

  // Default response
  return {
    id: 'msg-' + Date.now(),
    sender: 'assistant',
    timestamp,
    content: userRole === 'farmer'
      ? `I can help you analyze mandi price parity, find high-match institutional buyers, list new harvest lots, or track your escrow payments.`
      : `I can help you search lab-verified produce lots, post bulk commodity requirements, interpret natural language procurement queries, and track deliveries.`,
    suggestedActions: userRole === 'farmer'
      ? ['What\'s the current tomato price?', 'Find buyers for my tomatoes', 'Show my pending orders']
      : ['Find 500kg tomatoes near Mumbai', 'Show my pending orders', 'Create requirement for 1 ton potatoes']
  };
}
