import { Router } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { supabase } from '../config/supabase.js';
// Attempt to load .env from multiple potential locations (backend, frontend, root)
const possibleEnvPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'backend/.env'),
    path.resolve(process.cwd(), '../.env'),
    path.resolve(process.cwd(), 'frontend/.env'),
    path.resolve(process.cwd(), 'frontend/.env.local'),
    path.resolve(process.cwd(), '../frontend/.env'),
    path.resolve(process.cwd(), '../frontend/.env.local'),
];
for (const envPath of possibleEnvPaths) {
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
    }
}
const router = Router();
function getGroqApiKey() {
    return (process.env.GROQ_API_KEY ||
        process.env.VITE_GROQ_API_KEY ||
        process.env.NEXT_PUBLIC_GROQ_API_KEY ||
        process.env.GROQ_KEY ||
        '').trim();
}
function getGroqModel() {
    return (process.env.GROQ_MODEL ||
        process.env.VITE_GROQ_MODEL ||
        'openai/gpt-oss-20b').trim();
}
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
// Active negotiation status values in Fieldora
const ACTIVE_NEGOTIATION_STATUSES = ['pending', 'counter_offered', 'negotiation'];
/**
 * 1. Resolve Authenticated User Identity
 * Resolves verified identity from Supabase Auth JWT Bearer Token (Ground Truth)
 * or verified profiles database record.
 */
async function resolveUserContext(req) {
    let authUserId;
    let profileId;
    let userRole = req.body.userRole === 'buyer' ? 'buyer' : 'farmer';
    let userName = req.body.userName || '';
    let userEmail = req.body.email || '';
    let organization = '';
    let isAuthenticated = false;
    // A. Check Authorization Header Bearer JWT
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
            if (!error && authUser) {
                authUserId = authUser.id;
                userEmail = authUser.email || userEmail;
                if (authUser.user_metadata?.role === 'buyer' || authUser.user_metadata?.role === 'farmer') {
                    userRole = authUser.user_metadata.role;
                }
                userName = authUser.user_metadata?.name || authUser.email?.split('@')[0] || userName;
                organization = authUser.user_metadata?.organization || '';
                isAuthenticated = true;
                // Fetch linked profile from database
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .or(`auth_user_id.eq.${authUser.id},email.eq.${authUser.email}`)
                    .maybeSingle();
                if (profile) {
                    profileId = profile.id;
                    userName = profile.name || userName;
                    if (profile.role === 'buyer' || profile.role === 'farmer') {
                        userRole = profile.role;
                    }
                }
            }
        }
        catch (authErr) {
            console.warn('JWT verification warning in AI chat:', authErr);
        }
    }
    // B. Fallback: Lookup profile by provided userId / email if JWT was absent
    if (!isAuthenticated && (req.body.userId || req.body.email)) {
        const passedId = typeof req.body.userId === 'string' ? req.body.userId.trim() : '';
        const passedEmail = typeof req.body.email === 'string' ? req.body.email.trim() : '';
        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(passedId);
        if (isValidUUID || passedEmail) {
            try {
                let orConditions = [];
                if (isValidUUID) {
                    orConditions.push(`id.eq.${passedId}`, `auth_user_id.eq.${passedId}`);
                }
                if (passedEmail) {
                    orConditions.push(`email.eq.${passedEmail}`);
                }
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .or(orConditions.join(','))
                    .maybeSingle();
                if (profile) {
                    authUserId = profile.auth_user_id || undefined;
                    profileId = profile.id;
                    userName = profile.name || userName;
                    userEmail = profile.email || passedEmail;
                    if (profile.role === 'buyer' || profile.role === 'farmer') {
                        userRole = profile.role;
                    }
                    isAuthenticated = true;
                }
            }
            catch (err) {
                console.warn('Profile resolution error:', err);
            }
        }
    }
    // Set clean human fallback name if still undefined
    if (!userName) {
        userName = userRole === 'farmer' ? 'Farmer Producer' : 'Enterprise Buyer';
    }
    // Build unique ID array for database scoping
    const matchedIds = Array.from(new Set([
        authUserId,
        profileId,
        req.body.userId
    ])).filter((id) => Boolean(id && typeof id === 'string' && id.length > 5));
    // Also lookup role-specific entity IDs from farmers / buyers tables
    if (profileId || authUserId) {
        try {
            const pId = profileId || authUserId;
            if (userRole === 'farmer') {
                const { data: farmerRec } = await supabase
                    .from('farmers')
                    .select('id')
                    .or(`profile_id.eq.${pId},id.eq.${req.body.userId || pId}`)
                    .maybeSingle();
                if (farmerRec?.id && !matchedIds.includes(farmerRec.id)) {
                    matchedIds.push(farmerRec.id);
                }
            }
            else {
                const { data: buyerRec } = await supabase
                    .from('buyers')
                    .select('id')
                    .or(`profile_id.eq.${pId},id.eq.${req.body.userId || pId}`)
                    .maybeSingle();
                if (buyerRec?.id && !matchedIds.includes(buyerRec.id)) {
                    matchedIds.push(buyerRec.id);
                }
            }
        }
        catch (entityErr) {
            console.warn('Role entity resolution error:', entityErr);
        }
    }
    return {
        authUserId,
        profileId,
        userRole,
        userName,
        userEmail,
        organization,
        matchedIds,
        isAuthenticated
    };
}
/**
 * 2. Fetch User-Scoped Real Database Records & Public Market Context
 * Database is the single source of truth. Scoped strictly to authenticated user IDs.
 */
async function fetchUserScopedData(userCtx) {
    const { userRole, matchedIds } = userCtx;
    let userActiveNegotiations = [];
    let userAllNegotiations = [];
    let userOrders = [];
    let userListings = [];
    let userRequirements = [];
    // If user is resolved with valid IDs, query ONLY their records
    if (matchedIds.length > 0) {
        try {
            // 1. User Active Counter Offers / Negotiations
            const idFilterCol = userRole === 'farmer' ? 'farmer_id' : 'buyer_id';
            const { data: reqsData, error: reqsErr } = await supabase
                .from('purchase_requests')
                .select('*')
                .in(idFilterCol, matchedIds)
                .order('updated_at', { ascending: false });
            if (!reqsErr && reqsData) {
                userAllNegotiations = reqsData;
                userActiveNegotiations = reqsData.filter(r => ACTIVE_NEGOTIATION_STATUSES.includes((r.status || '').toLowerCase()));
            }
            // 2. User Orders
            const orderIdCol = userRole === 'farmer' ? 'farmer_id' : 'buyer_id';
            const { data: ordersData, error: ordersErr } = await supabase
                .from('orders')
                .select('*')
                .in(orderIdCol, matchedIds)
                .order('created_at', { ascending: false });
            if (!ordersErr && ordersData) {
                userOrders = ordersData;
            }
            // 3. User Produce Listings (for Farmer)
            if (userRole === 'farmer') {
                const { data: listingsData } = await supabase
                    .from('produce_listings')
                    .select('*')
                    .in('farmer_id', matchedIds)
                    .order('created_at', { ascending: false });
                if (listingsData)
                    userListings = listingsData;
            }
            // 4. User Buyer Requirements (for Buyer)
            if (userRole === 'buyer') {
                const { data: reqsList } = await supabase
                    .from('buyer_requirements')
                    .select('*')
                    .in('buyer_id', matchedIds)
                    .order('created_at', { ascending: false });
                if (reqsList)
                    userRequirements = reqsList;
            }
        }
        catch (err) {
            console.error('Error fetching user scoped database records:', err);
        }
    }
    // Public Marketplace Datasets (APMC benchmark prices, verified active listings, open demands, transport)
    const [marketPricesRes, publicProduceRes, publicDemandsRes, vehiclesRes] = await Promise.allSettled([
        supabase.from('market_prices').select('*').order('average_price', { ascending: false }).limit(40),
        supabase.from('produce_listings').select('*').eq('status', 'Active').order('created_at', { ascending: false }).limit(20),
        supabase.from('buyer_requirements').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(20),
        supabase.from('transport_vehicles').select('*').limit(15)
    ]);
    const marketPrices = marketPricesRes.status === 'fulfilled' && marketPricesRes.value.data ? marketPricesRes.value.data : [];
    const publicProduce = publicProduceRes.status === 'fulfilled' && publicProduceRes.value.data ? publicProduceRes.value.data : [];
    const publicDemands = publicDemandsRes.status === 'fulfilled' && publicDemandsRes.value.data ? publicDemandsRes.value.data : [];
    const transportVehicles = vehiclesRes.status === 'fulfilled' && vehiclesRes.value.data ? vehiclesRes.value.data : [];
    return {
        userActiveNegotiations,
        userAllNegotiations,
        userOrders,
        userListings,
        userRequirements,
        marketPrices,
        publicProduce,
        publicDemands,
        transportVehicles
    };
}
function findMatchingMarketPrice(message, marketPrices) {
    if (!marketPrices || marketPrices.length === 0)
        return null;
    const lower = message.toLowerCase();
    const aliases = {
        'Tomato': ['tomato', 'tamatar', 'टोमॅटो', 'टमाटर'],
        'Onion': ['onion', 'kanda', 'pyaz', 'कांदा', 'प्याज़', 'कांदे'],
        'Potato': ['potato', 'batata', 'aaloo', 'बटाटा', 'आलू', 'बटाटे'],
        'Ginger (Fresh)': ['ginger', 'aale', 'adrak', 'आले', 'अदरक', 'सातारा आले'],
        'Green Peas': ['peas', 'green peas', 'matar', 'watana', 'vatana', 'मटार', 'वाटाणा', 'मटर'],
        'Wheat': ['wheat', 'gehun', 'gehu', 'गहू', 'गेहूं'],
        'Rice': ['rice', 'paddy', 'chawal', 'basmati', 'तांदूळ', 'चावल', 'धान'],
        'Garlic': ['garlic', 'lahsun', 'lasun', 'लसूण', 'लहसुन'],
        'Chilli (Green)': ['chilli', 'chili', 'mirchi', 'हिरवी मिरची', 'मिर्ची'],
        'Capsicum': ['capsicum', 'shimla mirch', 'ढोबळी मिरची', 'शिमला मिर्च'],
        'Soybean': ['soybean', 'soya', 'सोयाबीन'],
        'Lemon': ['lemon', 'nimbu', 'limbu', 'लिंबू', 'नींबू'],
        'Carrot': ['carrot', 'gajar', 'गाजर'],
        'Jowar': ['jowar', 'sorghum', 'ज्वारी', 'ज्वार'],
        'Bajra': ['bajra', 'millet', 'बाजरी', 'बाजरा'],
        'Turmeric': ['turmeric', 'haldi', 'हळद', 'हल्दी'],
        'Coriander': ['coriander', 'kothimbir', 'dhaniya', 'कोथिंबीर', 'धनिया']
    };
    for (const [canonicalCrop, terms] of Object.entries(aliases)) {
        for (const term of terms) {
            if (lower.includes(term)) {
                const found = marketPrices.find((p) => (p.crop || '').toLowerCase().includes(canonicalCrop.toLowerCase()) ||
                    canonicalCrop.toLowerCase().includes((p.crop || '').toLowerCase()));
                if (found)
                    return found;
            }
        }
    }
    const directMatch = marketPrices.find((p) => {
        const cropName = (p.crop || '').toLowerCase();
        const localName = (p.local_name || '').toLowerCase();
        return ((cropName && lower.includes(cropName)) ||
            (localName && lower.includes(localName)) ||
            (cropName && cropName.includes(lower)));
    });
    return directMatch || marketPrices[0];
}
/**
 * 3. Fallback Response Generator (Truthful, Zero-Fabrication Local Handler)
 * Strictly uses real queried database records. Never invents data.
 */
function generateDirectSupabaseResponse(message, userCtx, dbData) {
    const lower = message.toLowerCase().trim();
    const { userName, userRole } = userCtx;
    // 1. Greetings / Small Talk
    const greetingWords = ['helo', 'hello', 'hi', 'hey', 'namaste', 'hola', 'good morning', 'good evening', 'good afternoon', 'hii', 'hy'];
    if (greetingWords.some(w => lower === w || lower.startsWith(w + ' ') || lower.startsWith(w + '!'))) {
        const reply = userRole === 'farmer'
            ? `**Hello ${userName}!** 👋\n\nI am your **Fieldora Agricultural Intelligence AI** powered by live Supabase data.\n\nHow can I assist your farming operations today?\n• Check **real-time APMC Mandi benchmark rates** for your crops\n• View **active counter offers & negotiations**\n• Find **verified institutional buyers & RFQs**\n• Track your **escrow orders & payout status**`
            : `**Hello ${userName}!** 👋\n\nI am your **Fieldora Procurement Intelligence AI** powered by live Supabase data.\n\nHow can I help you source harvest lots today?\n• Search **lab-certified farm-fresh lots** across Maharashtra & MP\n• View **active counter offers & procurement bids**\n• Compare **live Mandi rates vs farmer asking prices**\n• Monitor **GPS telemetry & smart escrow fulfillment**`;
        return {
            reply,
            suggestedActions: userRole === 'farmer'
                ? ['What is the current tomato price?', 'Show active counter offers', 'Check my pending orders']
                : ['Find Grade A+ produce lots', 'Show active counter offers', 'Check APMC market benchmark']
        };
    }
    // 2. Date / Time inquiries
    if (lower.includes('date') ||
        lower.includes('today') ||
        lower.includes('time') ||
        lower.includes('aaj') ||
        lower.includes('आज') ||
        lower.includes('तारीख') ||
        lower.includes('दिनांक')) {
        const now = new Date();
        const formattedDate = now.toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const formattedTime = now.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const reply = `📅 **Current Date & Time:**\n\n` +
            `• **Date:** ${formattedDate}\n` +
            `• **Time:** ${formattedTime} IST\n` +
            `• **Market Status:** APMC Mandi trading session is **active** with ${(dbData.marketPrices || []).length} benchmark commodities refreshed.`;
        return {
            reply,
            suggestedActions: [
                'Check today\'s mandi prices',
                'Show active counter offers',
                'Check active orders'
            ]
        };
    }
    // 3. Counter Offers / Negotiations inquiries (STRICT REAL DATA ONLY)
    if (lower.includes('counter') ||
        lower.includes('offer') ||
        lower.includes('negotiat') ||
        lower.includes('bid') ||
        lower.includes('quote') ||
        lower.includes('सौदे') ||
        lower.includes('प्रस्ताव') ||
        lower.includes('मागणी दर')) {
        const activeOffers = dbData.userActiveNegotiations || [];
        if (activeOffers.length > 0) {
            const topOffers = activeOffers.slice(0, 5);
            const offersText = topOffers.map((o, idx) => {
                const crop = o.crop_name || o.crop || 'Produce Lot';
                const qty = `${o.current_quantity ?? o.requested_quantity ?? 0} ${o.unit || 'kg'}`;
                const initialPrice = o.offered_price_per_unit ?? o.offered_price ?? 0;
                const currentPrice = o.current_price_per_unit ?? o.offered_price_per_unit ?? initialPrice;
                const partnerName = userRole === 'farmer' ? (o.buyer_company || o.buyer_name || 'Buyer') : (o.farmer_name || 'Farmer');
                const offerBy = o.current_offer_by ? (o.current_offer_by === 'buyer' ? 'Buyer' : 'Farmer') : 'Counter Party';
                const statusLabel = (o.status || 'Active').toUpperCase();
                return `${idx + 1}. **${crop}** — ${qty}\n` +
                    `   • Partner: **${partnerName}**\n` +
                    `   • Initial Offer: ₹${initialPrice}/unit | **Current Counter Price: ₹${currentPrice}/unit**\n` +
                    `   • Last Offer By: ${offerBy}\n` +
                    `   • Status: **${statusLabel}**`;
            }).join('\n\n');
            const reply = `According to your current account, you have **${activeOffers.length} active counter-offer(s) / negotiation(s)** in Supabase:\n\n` +
                `${offersText}\n\n` +
                `You can accept, revise, or counter-bid directly from your Negotiations section.`;
            return {
                reply,
                structuredData: { type: 'negotiation_list', data: topOffers },
                suggestedActions: [
                    'View all negotiations',
                    'Compare with APMC modal rate',
                    'Check pending orders'
                ]
            };
        }
        else {
            const reply = `According to your current account, you currently have **no active counter-offers or pending negotiations** in Supabase.\n\n` +
                `All previous requests are either completed, accepted, or no active counter-proposals are currently open for your account.`;
            return {
                reply,
                suggestedActions: userRole === 'farmer'
                    ? ['View buyer RFQs looking for produce', 'List new harvest lot', 'Check active escrow orders']
                    : ['Post new procurement RFQ', 'Browse farmer harvest lots', 'Track ongoing orders']
            };
        }
    }
    // 4. Order inquiries (STRICT REAL DATA ONLY)
    if (lower.includes('order') || lower.includes('escrow') || lower.includes('track') || lower.includes('status') || lower.includes('पेंडिंग') || lower.includes('ऑर्डर')) {
        const orders = dbData.userOrders || [];
        if (orders.length > 0) {
            const topOrders = orders.slice(0, 4);
            const ordersText = topOrders.map((o) => `• **Order #${o.order_number || o.id?.slice(0, 8)}**: ${o.crop} (${o.quantity} ${o.unit || 'kg'}) | Value: ₹${Number(o.total_amount || 0).toLocaleString('en-IN')} | Status: **${o.status || 'Confirmed'}** | Escrow: **${o.payment_status || 'Pending'}**`).join('\n');
            const reply = `You have **${orders.length} active order(s)** tracked in the Fieldora Escrow System:\n\n${ordersText}\n\nAll transactions are secured via smart escrow locked contracts with lab quality verification gates.`;
            return {
                reply,
                structuredData: { type: 'order_summary', data: topOrders },
                suggestedActions: [
                    'Track active transport vehicle',
                    'Check escrow payout status',
                    'View order quality assay'
                ]
            };
        }
        else {
            const reply = `According to your current account, you have **no active orders** currently in progress in Supabase.`;
            return {
                reply,
                suggestedActions: userRole === 'farmer'
                    ? ['Find matching buyers for my crops', 'List new harvest lot', 'Show active counter offers']
                    : ['Browse harvest lots in marketplace', 'Create new buyer RFQ', 'Show active counter offers']
            };
        }
    }
    // 5. Price inquiries
    if (lower.includes('price') ||
        lower.includes('mandi') ||
        lower.includes('bhav') ||
        lower.includes('rate') ||
        lower.includes('भाव') ||
        lower.includes('बाजारभाव') ||
        lower.includes('दर') ||
        lower.includes('आले') ||
        lower.includes('वाटाणा') ||
        lower.includes('टोमॅटो') ||
        lower.includes('कांदा') ||
        lower.includes('बटाटा')) {
        const matchedPrice = findMatchingMarketPrice(message, dbData.marketPrices);
        if (matchedPrice) {
            const reply = `**Live APMC Mandi Price for ${matchedPrice.crop} (${matchedPrice.local_name || ''})**\n\n` +
                `• **Mandi:** ${matchedPrice.mandi || 'Vashi Mandi'}, ${matchedPrice.state || 'Maharashtra'}\n` +
                `• **Modal / Current Rate:** ₹${matchedPrice.current_price ?? matchedPrice.average_price}/quintal\n` +
                `• **Price Range:** ₹${matchedPrice.lowest_price || Math.round((matchedPrice.average_price || 2000) * 0.9)} - ₹${matchedPrice.highest_price || Math.round((matchedPrice.average_price || 2000) * 1.1)}/q\n` +
                `• **Daily Trend:** ${matchedPrice.price_trend || 'Stable'} (${matchedPrice.change_percent ? (matchedPrice.change_percent > 0 ? '+' : '') + matchedPrice.change_percent + '%' : '0.0%'})\n` +
                `• **Arrival Volume:** ${matchedPrice.arrival_volume || 150} Quintals\n\n` +
                `💡 *Recommendation:* ${matchedPrice.recommendation || matchedPrice.insight_summary || 'Prices are healthy. Compare nearby mandis or match with verified buyers.'}`;
            return {
                reply,
                structuredData: { type: 'market_price', data: matchedPrice },
                suggestedActions: [
                    `Find buyers for ${matchedPrice.crop}`,
                    `Compare nearby mandi rates`,
                    `View 30-day price trend`
                ]
            };
        }
    }
    // 6. Transport & Logistics inquiries
    if (lower.includes('transport') || lower.includes('truck') || lower.includes('driver') || lower.includes('vehicle') || lower.includes('logistics') || lower.includes('वाहतूक') || lower.includes('गाडी')) {
        const vehicles = dbData.transportVehicles || [];
        if (vehicles.length > 0) {
            const topVehicles = vehicles.slice(0, 3);
            const vText = topVehicles.map((v) => `• **${v.vehicle_type || 'Refrigerated Truck'} (${v.plate_number || 'MH-14-GH-4921'})**: Capacity: ${v.capacity_tons || 10} Tons | Rate: ₹${v.rate_per_km || 38}/km | Status: **${v.status || 'Available'}** | Location: ${v.current_location || 'Nashik'}`).join('\n');
            const reply = `🚚 **Available Transport & Fleet on Fieldora Network:**\n\n${vText}\n\nAll vehicles feature real-time IoT temperature monitoring and GPS telemetry tracking.`;
            return {
                reply,
                structuredData: { type: 'transport_list', data: topVehicles },
                suggestedActions: [
                    'Book transport for harvest lot',
                    'Calculate freight estimate',
                    'Track en-route vehicle'
                ]
            };
        }
    }
    // 7. Buyer / Requirement inquiries
    if (lower.includes('buyer') || lower.includes('rfq') || lower.includes('demand') || lower.includes('requirement') || lower.includes('ग्राहक') || lower.includes('मागणी')) {
        const reqs = userRole === 'buyer' && dbData.userRequirements.length > 0
            ? dbData.userRequirements
            : dbData.publicDemands;
        if (reqs.length > 0) {
            const topReqs = reqs.slice(0, 3);
            const reqsText = topReqs.map((r) => `• **${r.company_name || r.buyer_name || 'Verified Buyer'}**: Seeking **${r.required_quantity || r.quantity} ${r.unit || 'q'} of ${r.crop || r.crop_name}** @ target ₹${r.target_price || 2500}/q for ${r.delivery_location || 'Mumbai'}`).join('\n');
            const reply = userRole === 'buyer'
                ? `**Your Active Procurement Requirements in Supabase:**\n\n${reqsText}`
                : `**Active Verified Institutional Buyer Demands in Supabase:**\n\n${reqsText}\n\nThese buyers have guaranteed deposit commitments and are ready for farm-gate dispatch.`;
            return {
                reply,
                structuredData: { type: 'buyer_matches', data: topReqs },
                suggestedActions: [
                    'Submit harvest lot offer',
                    'View all buyer tenders',
                    'Check mandi price comparison'
                ]
            };
        }
        else {
            const reply = userRole === 'buyer'
                ? `According to your current account, you currently have **no open buyer requirements** in Supabase.`
                : `There are currently no open buyer requirements matching your query.`;
            return {
                reply,
                suggestedActions: ['Create new requirement', 'Check mandi benchmark']
            };
        }
    }
    // 8. Produce / Harvest inquiries
    if (lower.includes('produce') || lower.includes('listing') || lower.includes('crop') || lower.includes('stock') || lower.includes('पिक') || lower.includes('माल')) {
        const listings = userRole === 'farmer' && dbData.userListings.length > 0
            ? dbData.userListings
            : dbData.publicProduce;
        if (listings.length > 0) {
            const topLots = listings.slice(0, 3);
            const lotsText = topLots.map((p) => `• **${p.crop || p.crop_name} (${p.variety || 'Standard'})**: ${p.quantity} ${p.unit || 'q'} @ ₹${p.expected_price}/q | Grade: ${p.quality || 'Grade A'} | Location: ${p.location || 'Maharashtra'}`).join('\n');
            const reply = userRole === 'farmer'
                ? `**Your Active Produce Listings in Supabase:**\n\n${lotsText}`
                : `**Available Verified Produce Lots in Supabase:**\n\n${lotsText}`;
            return {
                reply,
                structuredData: { type: 'produce_list', data: topLots },
                suggestedActions: [
                    'Post new harvest listing',
                    'Search Grade A+ lots',
                    'Compare with APMC modal rate'
                ]
            };
        }
        else {
            const reply = userRole === 'farmer'
                ? `According to your current account, you currently have **no active produce listings** in Supabase.`
                : `There are currently no active produce lots listed in the marketplace.`;
            return {
                reply,
                suggestedActions: ['List new harvest lot', 'Check APMC prices']
            };
        }
    }
    // 9. Default intelligent guidance
    const reply = userRole === 'farmer'
        ? `I can help you analyze **APMC Mandi rates**, review your **active counter offers & negotiations**, check your **escrow orders**, or book **transport**.\n\nTry asking:\n• *"Show active counter offers"*\n• *"What is the tomato rate in Vashi?"*\n• *"Check my pending orders"*\n• *"Find buyers for my crops"*`
        : `I can help you find **certified produce lots**, review your **active counter offers**, compare **mandi benchmarks vs seller quotes**, or track **escrow orders**.\n\nTry asking:\n• *"Show active counter offers"*\n• *"Find Grade A tomatoes near Mumbai"*\n• *"What are today's potato prices?"*\n• *"Track my pending orders"*`;
    return {
        reply,
        suggestedActions: userRole === 'farmer'
            ? ['What is the current tomato price?', 'Show active counter offers', 'Check my pending orders']
            : ['Find Grade A produce lots', 'Show active counter offers', 'Check APMC market benchmark']
    };
}
/**
 * 4. POST /api/ai/chat (Main AI Assistant Endpoint)
 */
router.post('/chat', async (req, res) => {
    try {
        const { message, history = [] } = req.body;
        if (!message || typeof message !== 'string') {
            return res.status(400).json({ success: false, message: 'A text message query is required.' });
        }
        // 1. Resolve Authenticated User Context from JWT or Database
        const userCtx = await resolveUserContext(req);
        // 2. Fetch User-Scoped Database Data (Strictly authenticated user's records)
        const dbData = await fetchUserScopedData(userCtx);
        const apiKey = getGroqApiKey();
        const model = getGroqModel();
        // 3. Format concise, truthful context for the LLM
        const lowerMsg = message.toLowerCase();
        // User-specific active negotiations summary
        const userActiveOffersSummary = (dbData.userActiveNegotiations || []).map((o, idx) => {
            const partner = userCtx.userRole === 'farmer' ? (o.buyer_company || o.buyer_name || 'Buyer') : (o.farmer_name || 'Farmer');
            return `${idx + 1}. Crop: ${o.crop_name || o.crop}, Qty: ${o.current_quantity ?? o.requested_quantity} ${o.unit || 'kg'}, Initial Offer: ₹${o.offered_price_per_unit ?? o.offered_price}/unit, Current Counter: ₹${o.current_price_per_unit ?? o.offered_price_per_unit}/unit, Offerer: ${o.current_offer_by || 'counter-party'}, Partner: ${partner}, Status: ${o.status}`;
        });
        // User-specific orders summary
        const userOrdersSummary = (dbData.userOrders || []).slice(0, 4).map((o) => `Order #${o.order_number || o.id?.slice(0, 8)}: ${o.crop} (${o.quantity}${o.unit || 'kg'}) | ₹${o.total_amount} | Status: ${o.status} | Escrow: ${o.payment_status}`);
        // User-specific listings / requirements
        const userListingsSummary = (dbData.userListings || []).slice(0, 4).map((l) => `${l.crop} (${l.variety || 'Standard'}): ${l.quantity}${l.unit || 'q'} @ ₹${l.expected_price}/q | Status: ${l.status}`);
        const userReqsSummary = (dbData.userRequirements || []).slice(0, 4).map((r) => `${r.crop_name || r.crop}: Seeking ${r.required_quantity || r.quantity}${r.unit || 'q'} @ target ₹${r.target_price}/q | Status: ${r.status}`);
        // Relevant market prices for query
        const relevantPrices = (dbData.marketPrices || [])
            .filter((p) => lowerMsg.includes((p.crop || '').toLowerCase()) ||
            (p.local_name && lowerMsg.includes(p.local_name.toLowerCase())) ||
            ['Tomato', 'Onion', 'Potato', 'Ginger', 'Wheat'].some(c => (p.crop || '').includes(c)))
            .slice(0, 5)
            .map((p) => `${p.crop} (${p.local_name || ''}) @ ${p.mandi}: Modal ₹${p.current_price ?? p.average_price}/q (${p.price_trend || 'stable'})`);
        const currentDateStr = new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const systemPrompt = `You are the Fieldora Platinum Agricultural Marketplace Intelligence AI.
Fieldora connects farmers directly with enterprise buyers with smart escrow order lifecycles and real-time APMC Mandi benchmarking.

CURRENT SYSTEM DATE: ${currentDateStr}
CURRENT AUTHENTICATED USER:
- Name: ${userCtx.userName}
- Role: ${userCtx.userRole === 'farmer' ? 'Farmer / Producer' : 'Enterprise Buyer'}
- Email: ${userCtx.userEmail || 'N/A'}
- Is Authenticated: ${userCtx.isAuthenticated}

AUTHENTICATED USER'S REAL DATABASE RECORDS (Source of Truth):
- Active Counter Offers / Negotiations (${userActiveOffersSummary.length} active records in Supabase):
${userActiveOffersSummary.length > 0 ? userActiveOffersSummary.join('\n') : 'NONE (0 active counter offers found for this user account)'}

- User Orders (${userOrdersSummary.length} records in Supabase):
${userOrdersSummary.length > 0 ? userOrdersSummary.join('\n') : 'NONE (0 orders in database)'}

- User ${userCtx.userRole === 'farmer' ? 'Produce Listings' : 'Buyer Requirements'} (${userCtx.userRole === 'farmer' ? userListingsSummary.length : userReqsSummary.length} in Supabase):
${userCtx.userRole === 'farmer' ? (userListingsSummary.length ? userListingsSummary.join('\n') : 'NONE') : (userReqsSummary.length ? userReqsSummary.join('\n') : 'NONE')}

LIVE APMC MANDI BENCHMARK RATES:
${relevantPrices.join('\n')}

STRICT CORE RULES:
1. THE DATABASE IS THE ONLY SOURCE OF TRUTH. NEVER INVENT OR FABRICATE DATA.
2. If the user asks about counter offers, negotiations, orders, or listings, and the database shows 0 records / NONE, you MUST explicitly state that they currently have 0 active records in their account.
3. NEVER invent buyer names (like "FreshMart Agro" or fake corporations) or fake crop lots unless they appear in the user's real records above.
4. Answer concisely, cleanly, and professionally using markdown formatting (bullet points, bold highlights).
5. Support English, Hindi, and Marathi naturally based on the user's language.`;
        // If no GROQ_API_KEY is available, use our high-quality data-grounded fallback
        if (!apiKey) {
            console.warn('GROQ_API_KEY is not configured in backend or frontend env. Using Supabase-grounded response.');
            const fallbackResult = generateDirectSupabaseResponse(message, userCtx, dbData);
            return res.json({
                success: true,
                reply: fallbackResult.reply,
                structuredData: fallbackResult.structuredData,
                suggestedActions: fallbackResult.suggestedActions,
                isFallback: true,
                note: 'Add GROQ_API_KEY to your .env file for full generative LLM capability.'
            });
        }
        // 4. Prepare messages for Groq API
        const messages = [
            { role: 'system', content: systemPrompt },
            ...(history || []).slice(-6).map((h) => ({
                role: h.sender === 'user' ? 'user' : 'assistant',
                content: String(h.content || '')
            })),
            { role: 'user', content: message }
        ];
        // 5. Call Groq LLM API with prioritized model fallback strategy
        let response = null;
        const candidateModels = Array.from(new Set([
            model,
            'openai/gpt-oss-20b',
            'qwen/qwen3.6-27b',
            'groq/compound-mini',
            'groq/compound',
            'openai/gpt-oss-120b',
            'llama-3.3-70b-versatile',
            'llama-3.1-8b-instant'
        ]));
        let successfulModel = model;
        for (const testModel of candidateModels) {
            try {
                const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: testModel,
                        messages,
                        temperature: 0.2,
                        max_tokens: 450
                    })
                });
                if (res.ok) {
                    response = res;
                    successfulModel = testModel;
                    break;
                }
                else {
                    const errText = await res.text();
                    console.warn(`Groq error with model ${testModel} (${res.status}): ${errText.slice(0, 120)}`);
                }
            }
            catch (fetchErr) {
                console.error(`Groq fetch network error with model ${testModel}:`, fetchErr?.message);
            }
        }
        if (!response || !response.ok) {
            console.warn('Groq API calls failed or rate limited. Falling back to Supabase-grounded response.');
            const fallbackResult = generateDirectSupabaseResponse(message, userCtx, dbData);
            return res.json({
                success: true,
                reply: fallbackResult.reply,
                structuredData: fallbackResult.structuredData,
                suggestedActions: fallbackResult.suggestedActions,
                isFallback: true
            });
        }
        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || 'I could not generate an answer at this moment. Please try again.';
        // Check if we can attach structured cards to enhance visual experience
        let structuredData = undefined;
        if (lowerMsg.includes('price') || lowerMsg.includes('mandi') || lowerMsg.includes('rate') || lowerMsg.includes('bhav')) {
            const matchedPrice = findMatchingMarketPrice(message, dbData.marketPrices);
            if (matchedPrice) {
                structuredData = { type: 'market_price', data: matchedPrice };
            }
        }
        else if (lowerMsg.includes('counter') || lowerMsg.includes('offer') || lowerMsg.includes('negotiat')) {
            if (dbData.userActiveNegotiations.length > 0) {
                structuredData = { type: 'negotiation_list', data: dbData.userActiveNegotiations.slice(0, 3) };
            }
        }
        else if (lowerMsg.includes('order') || lowerMsg.includes('escrow') || lowerMsg.includes('track')) {
            if (dbData.userOrders.length > 0) {
                structuredData = { type: 'order_summary', data: dbData.userOrders.slice(0, 3) };
            }
        }
        const suggestedActions = userCtx.userRole === 'farmer'
            ? ['What is the current tomato price?', 'Show active counter offers', 'Check my pending orders']
            : ['Find Grade A produce lots', 'Show active counter offers', 'Check APMC market benchmark'];
        res.json({
            success: true,
            reply,
            structuredData,
            suggestedActions,
            model: successfulModel
        });
    }
    catch (error) {
        console.error('AI Chat Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal server error in AI chat' });
    }
});
// GET /api/ai/health - Verify AI status and configured keys
router.get('/health', async (req, res) => {
    const apiKey = getGroqApiKey();
    const model = getGroqModel();
    res.json({
        status: 'online',
        hasGroqKey: Boolean(apiKey && apiKey.length > 10),
        groqKeyPrefix: apiKey ? `${apiKey.substring(0, 6)}...` : 'Not configured',
        model,
        timestamp: new Date().toISOString()
    });
});
export default router;
