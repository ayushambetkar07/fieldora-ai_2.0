import {
  ParsedSearchQuery,
  AIAssistantMessage,
  UserRole,
  ProduceListing,
  OrderItem,
  BuyerRequirement
} from '../types';

import {
  CROP_MASTER,
  getCropDefaultVariety,
  getCropDefaultPrice
} from '../data/cropMaster';

const API_BASE = 'http://localhost:5000/api';

export function parseNaturalLanguageQuery(query: string): ParsedSearchQuery {
  const lower = query.toLowerCase();
  const result: ParsedSearchQuery = { rawQuery: query };

  // Crop detection across all master crops
  for (const cropItem of CROP_MASTER) {
    const cName = cropItem.name.toLowerCase();

    if (lower.includes(cName)) {
      result.crop = cropItem.name;
      break;
    }
  }

  // Alias fallbacks
  if (!result.crop) {
    if (
      lower.includes('tomato') ||
      lower.includes('tamatar')
    ) {
      result.crop = 'Tomato';
    } else if (
      lower.includes('onion') ||
      lower.includes('pyaz') ||
      lower.includes('kanda')
    ) {
      result.crop = 'Onion';
    } else if (
      lower.includes('potato') ||
      lower.includes('aaloo') ||
      lower.includes('batata')
    ) {
      result.crop = 'Potato';
    } else if (
      lower.includes('wheat') ||
      lower.includes('gehun')
    ) {
      result.crop = 'Wheat';
    } else if (
      lower.includes('rice') ||
      lower.includes('paddy') ||
      lower.includes('chawal') ||
      lower.includes('basmati')
    ) {
      result.crop = 'Rice / Paddy';
    } else if (
      lower.includes('soybean') ||
      lower.includes('soya')
    ) {
      result.crop = 'Soybean';
    } else if (
      lower.includes('capsicum') ||
      lower.includes('shimla mirch') ||
      lower.includes('bell pepper')
    ) {
      result.crop = 'Capsicum';
    } else if (
      lower.includes('chilli') ||
      lower.includes('chili') ||
      lower.includes('mirchi')
    ) {
      result.crop = 'Green Chilli';
    } else if (
      lower.includes('ginger') ||
      lower.includes('adrak') ||
      lower.includes('aale')
    ) {
      result.crop = 'Ginger';
    } else if (
      lower.includes('garlic') ||
      lower.includes('lahsun') ||
      lower.includes('lasun')
    ) {
      result.crop = 'Garlic';
    } else if (
      lower.includes('lemon') ||
      lower.includes('nimbu') ||
      lower.includes('limbu')
    ) {
      result.crop = 'Lemon';
    } else if (
      lower.includes('carrot') ||
      lower.includes('gajar')
    ) {
      result.crop = 'Carrot';
    } else if (
      lower.includes('jowar') ||
      lower.includes('sorghum')
    ) {
      result.crop = 'Jowar';
    } else if (
      lower.includes('bajra') ||
      lower.includes('millet')
    ) {
      result.crop = 'Bajra';
    } else if (
      lower.includes('masoor') ||
      lower.includes('lentil')
    ) {
      result.crop = 'Masoor';
    }
  }

  // Quantity detection
  const qtyMatch = query.match(
    /(\d+(?:,\d+)?(?:\.\d+)?)\s*(kg|quintal|qtl|ton|tons|quintals|q)/i
  );

  if (qtyMatch) {
    const rawVal = parseFloat(
      qtyMatch[1].replace(/,/g, '')
    );

    const unit = qtyMatch[2].toLowerCase();

    if (unit.startsWith('ton')) {
      result.quantity = rawVal * 10;
      result.unit = 'quintal (from ' + rawVal + ' tons)';
    } else if (unit === 'kg') {
      result.quantity = Math.round(rawVal / 100);
      result.unit = `${rawVal} kg`;
    } else {
      result.quantity = rawVal;
      result.unit = 'quintal';
    }
  }

  // Quality detection
  if (
    lower.includes('grade a+') ||
    lower.includes('grade a plus')
  ) {
    result.quality = 'Grade A+';
  } else if (
    lower.includes('grade a') ||
    lower.includes('export')
  ) {
    result.quality = 'Grade A';
  } else if (
    lower.includes('grade b')
  ) {
    result.quality = 'Grade B';
  }

  // Location detection
  const locations = [
    'mumbai',
    'nashik',
    'pune',
    'vashi',
    'lasalgaon',
    'indore',
    'karnal',
    'nagpur',
    'delhi',
    'satara',
    'solapur',
    'jaipur'
  ];

  for (const loc of locations) {
    if (lower.includes(loc)) {
      result.location =
        loc.charAt(0).toUpperCase() + loc.slice(1);
      break;
    }
  }

  // Maximum price detection
  const priceMatch = query.match(
    /(?:under|below|less than|max|up to|₹|rs\.?)\s*(\d+(?:,\d+)?)/i
  );

  if (priceMatch) {
    result.maxPrice = parseInt(
      priceMatch[1].replace(/,/g, ''),
      10
    );
  }

  return result;
}

export function extractRequirementFromPrompt(prompt: string) {
  const parsed = parseNaturalLanguageQuery(prompt);

  const selectedCrop = parsed.crop || 'Potato';

  // Extract date if present
  let requiredBy = '2026-09-20';

  if (
    prompt.toLowerCase().includes('september') ||
    prompt.toLowerCase().includes('sept')
  ) {
    const dayMatch = prompt.match(
      /(\d{1,2})\s*(?:th|st|nd|rd)?\s*(?:sept|september)/i
    );

    if (dayMatch) {
      const day = dayMatch[1].padStart(2, '0');
      requiredBy = `2026-09-${day}`;
    }
  }

  return {
    crop: selectedCrop,
    variety: getCropDefaultVariety(selectedCrop),
    quantity: parsed.quantity || 10,
    unit: 'quintal' as const,
    targetPrice:
      parsed.maxPrice ||
      getCropDefaultPrice(selectedCrop),
    qualityRequirements:
      (parsed.quality || 'Grade A') as any,
    deliveryLocation: parsed.location
      ? `${parsed.location} Central Hub`
      : 'Mumbai Facility',
    requiredByDate: requiredBy,
    paymentTerms:
      '100% Escrow deposit upon contract confirmation'
  };
}

interface AssistantContext {
  userRole: UserRole;
  userData: any;
  marketData: any;
  produceList: ProduceListing[];
  ordersList: OrderItem[];
  requirementsList: BuyerRequirement[];
}

export async function getAssistantResponse(
  query: string,
  context: AssistantContext,
  history?: {
    sender: 'user' | 'assistant';
    content: string;
  }[]
): Promise<AIAssistantMessage> {
  const timestamp = new Date().toLocaleTimeString(
    [],
    {
      hour: '2-digit',
      minute: '2-digit'
    }
  );

  const userData = {
    role: context.userRole,
    ...context.userData,

    listings: context.produceList.map((p) => ({
      crop: p.crop,
      variety: p.variety,
      quantity: p.quantity + ' ' + p.unit,
      price: '₹' + p.expectedPrice + '/q',
      location: p.location,
      quality: p.quality,
      status: p.status
    })),

    requirements: context.requirementsList.map((r) => ({
      crop: r.crop,
      quantity: r.quantity + ' ' + r.unit,
      targetPrice: '₹' + r.targetPrice + '/q',
      location: r.deliveryLocation,
      status: r.status
    })),

    orders: context.ordersList.map((o) => ({
      orderNumber: o.orderNumber,
      crop: o.crop,
      quantity: o.quantity + ' ' + o.unit,
      totalAmount:
        '₹' +
        o.totalAmount.toLocaleString('en-IN'),
      status: o.status,
      paymentStatus: o.paymentStatus
    }))
  };

  const marketData = context.marketData;

  try {
    const response = await fetch(
      `${API_BASE}/ai/chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: query,
          userRole: context.userRole,
          userData,
          marketData,
          history
        })
      }
    );

    if (!response.ok) {
      throw new Error(
        `Backend returned ${response.status}`
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(
        data.message || 'AI request failed'
      );
    }

    return {
      id: 'msg-' + Date.now(),
      sender: 'assistant',
      timestamp,
      content: data.reply,
      suggestedActions:
        getSuggestedActions(context.userRole)
    };
  } catch (error: any) {
    console.error('AI chat error:', error);

    return {
      id: 'msg-' + Date.now(),
      sender: 'assistant',
      timestamp,
      content:
        `I'm having trouble connecting to the AI service. Please make sure the backend server is running on port 5000.\n\nError: ${error.message}`,
      suggestedActions: ['Retry']
    };
  }
}

function getSuggestedActions(
  userRole: UserRole
): string[] {
  return userRole === 'farmer'
    ? [
      'What is my produce listing price?',
      'Show my active orders',
      'Which buyers match my crops?'
    ]
    : [
      'Show available produce lots',
      'What are current market prices?',
      'Track my pending orders'
    ];
}