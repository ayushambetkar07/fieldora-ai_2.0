import { ParsedSearchQuery, AIAssistantMessage, UserRole, ProduceListing, MarketPricePoint, OrderItem, BuyerRequirement } from '../types';

const API_BASE = 'http://localhost:5000/api';

export function parseNaturalLanguageQuery(query: string): ParsedSearchQuery {
  const lower = query.toLowerCase();
  const result: ParsedSearchQuery = { rawQuery: query };

  if (lower.includes('tomato')) result.crop = 'Tomato';
  else if (lower.includes('onion')) result.crop = 'Onion';
  else if (lower.includes('potato')) result.crop = 'Potato';
  else if (lower.includes('wheat')) result.crop = 'Wheat';
  else if (lower.includes('rice') || lower.includes('basmati')) result.crop = 'Rice';
  else if (lower.includes('soybean') || lower.includes('soya')) result.crop = 'Soybean';

  const qtyMatch = query.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(kg|quintal|qtl|ton|tons|quintals|q)/i);
  if (qtyMatch) {
    const rawVal = parseFloat(qtyMatch[1].replace(/,/g, ''));
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

  if (lower.includes('grade a+') || lower.includes('grade a plus')) result.quality = 'Grade A+';
  else if (lower.includes('grade a') || lower.includes('export')) result.quality = 'Grade A';
  else if (lower.includes('grade b')) result.quality = 'Grade B';

  const locations = ['mumbai', 'nashik', 'pune', 'vashi', 'lasalgaon', 'indore', 'karnal', 'nagpur', 'delhi'];
  for (const loc of locations) {
    if (lower.includes(loc)) {
      result.location = loc.charAt(0).toUpperCase() + loc.slice(1);
      break;
    }
  }

  const priceMatch = query.match(/(?:under|below|less than|max|up to|₹|rs\.?)\s*(\d+(?:,\d+)?)/i);
  if (priceMatch) {
    result.maxPrice = parseInt(priceMatch[1].replace(/,/g, ''), 10);
  }

  return result;
}

export function extractRequirementFromPrompt(prompt: string) {
  const parsed = parseNaturalLanguageQuery(prompt);
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
  history?: { sender: 'user' | 'assistant'; content: string }[]
): Promise<AIAssistantMessage> {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const userData = {
    role: context.userRole,
    ...context.userData,
    listings: context.produceList.map(p => ({
      crop: p.crop,
      variety: p.variety,
      quantity: p.quantity + ' ' + p.unit,
      price: '₹' + p.expectedPrice + '/q',
      location: p.location,
      quality: p.quality,
      status: p.status
    })),
    requirements: context.requirementsList.map(r => ({
      crop: r.crop,
      quantity: r.quantity + ' ' + r.unit,
      targetPrice: '₹' + r.targetPrice + '/q',
      location: r.deliveryLocation,
      status: r.status
    })),
    orders: context.ordersList.map(o => ({
      orderNumber: o.orderNumber,
      crop: o.crop,
      quantity: o.quantity + ' ' + o.unit,
      totalAmount: '₹' + o.totalAmount.toLocaleString('en-IN'),
      status: o.status,
      paymentStatus: o.paymentStatus
    }))
  };

  const marketData = context.marketData;

  try {
    const response = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: query,
        userRole: context.userRole,
        userData,
        marketData,
        history
      })
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'AI request failed');
    }

    return {
      id: 'msg-' + Date.now(),
      sender: 'assistant',
      timestamp,
      content: data.reply,
      suggestedActions: getSuggestedActions(context.userRole)
    };
  } catch (error: any) {
    console.error('AI chat error:', error);
    return {
      id: 'msg-' + Date.now(),
      sender: 'assistant',
      timestamp,
      content: `I'm having trouble connecting to the AI service. Please make sure the backend server is running on port 5000.\n\nError: ${error.message}`,
      suggestedActions: ['Retry']
    };
  }
}

function getSuggestedActions(userRole: UserRole): string[] {
  return userRole === 'farmer'
    ? ['What is my produce listing price?', 'Show my active orders', 'Which buyers match my crops?']
    : ['Show available produce lots', 'What are current market prices?', 'Track my pending orders'];
}
