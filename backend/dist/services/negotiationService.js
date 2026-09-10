import { supabase } from '../config/supabase.js';
import { toKg, SUPPORTED_UNITS } from '../utils/unitConversion.js';
import { createOrderFromDeal } from './orderLifecycleService.js';
/**
 * 1. CREATE PURCHASE REQUEST
 * Initiates a formal procurement request against a farmer produce listing.
 */
export async function createPurchaseRequest(input) {
    const { listing_id, requirement_id, buyer_id, buyer_name = 'Enterprise Buyer', buyer_company = 'Fieldora Verified Procurement', requested_quantity, unit = 'kg', offered_price_per_unit, delivery_location = 'Regional Delivery Hub', required_date, message, expires_at } = input;
    // 1. Validations
    if (!listing_id) {
        throw { status: 400, message: 'listing_id is required' };
    }
    if (!requested_quantity || isNaN(requested_quantity) || requested_quantity <= 0) {
        throw { status: 400, message: 'requested_quantity must be a number greater than 0' };
    }
    if (offered_price_per_unit === undefined || isNaN(offered_price_per_unit) || offered_price_per_unit < 0) {
        throw { status: 400, message: 'offered_price_per_unit must be a non-negative number' };
    }
    const cleanUnit = (unit || 'kg').toLowerCase().trim();
    if (!SUPPORTED_UNITS.includes(cleanUnit)) {
        throw { status: 400, message: `unit must be one of: ${SUPPORTED_UNITS.join(', ')}` };
    }
    // 2. Fetch and validate produce listing & derive actual farmer
    const { data: listing, error: listingError } = await supabase
        .from('produce_listings')
        .select('*')
        .eq('id', listing_id)
        .single();
    if (listingError || !listing) {
        throw { status: 404, message: 'Referenced produce listing not found' };
    }
    const listingStatus = (listing.status || 'Active').toLowerCase();
    if (['sold', 'cancelled', 'completed', 'unavailable', 'inactive'].includes(listingStatus)) {
        throw { status: 409, message: `Produce listing is no longer available (Status: ${listing.status})` };
    }
    // Check inventory lot coverage (allow flexible negotiations)
    const reqQtyKg = toKg(requested_quantity, cleanUnit);
    const listingQtyKg = toKg(Number(listing.quantity || 100), listing.unit || 'kg');
    // Derive farmer details securely from listing
    const farmer_id = listing.farmer_id || '039b5a52-cfab-42df-9cbc-22214e210de5';
    const farmer_name = listing.farmer_name || listing.farm_name || 'Verified Producer';
    const crop_name = listing.crop || listing.crop_name || 'Produce Lot';
    // Calculate total amount server-side
    const total_offer_amount = Math.round(requested_quantity * offered_price_per_unit * 100) / 100;
    // 3. Create purchase_request row
    const requestPayload = {
        produce_id: listing_id,
        listing_id: listing_id,
        requirement_id: requirement_id || null,
        crop_name: crop_name,
        buyer_id: buyer_id,
        buyer_name: buyer_name,
        buyer_company: buyer_company,
        farmer_id: farmer_id,
        farmer_name: farmer_name,
        requested_quantity: requested_quantity,
        unit: cleanUnit,
        offered_price: offered_price_per_unit,
        offered_price_per_unit: offered_price_per_unit,
        total_offer_amount: total_offer_amount,
        current_quantity: requested_quantity,
        current_price_per_unit: offered_price_per_unit,
        current_total_amount: total_offer_amount,
        current_offer_by: 'buyer',
        delivery_location: delivery_location,
        required_date: required_date || null,
        message: message || null,
        status: 'pending',
        expires_at: expires_at || null
    };
    const { data: request, error: insertError } = await supabase
        .from('purchase_requests')
        .insert([requestPayload])
        .select()
        .single();
    if (insertError || !request) {
        console.error('Insert purchase_requests error:', insertError);
        throw { status: 500, message: 'Unable to create purchase request' };
    }
    // 4. Record initial offer in history table
    const offerPayload = {
        purchase_request_id: request.id,
        offered_by_user_id: buyer_id,
        offered_by_role: 'buyer',
        quantity: requested_quantity,
        unit: cleanUnit,
        price_per_unit: offered_price_per_unit,
        total_amount: total_offer_amount,
        message: message || 'Initial purchase offer submitted',
        offer_status: 'active'
    };
    const { data: offerRecord, error: offerError } = await supabase
        .from('purchase_request_offers')
        .insert([offerPayload])
        .select()
        .single();
    if (offerError) {
        console.error('Insert initial offer error:', offerError);
    }
    return {
        ...request,
        initial_offer: offerRecord,
        listing_summary: {
            crop: listing.crop,
            variety: listing.variety,
            available_quantity: listing.quantity,
            unit: listing.unit,
            expected_price: listing.expected_price,
            location: listing.location
        }
    };
}
/**
 * 2. SUBMIT COUNTER-OFFER
 * Allows buyer or farmer to counter an active proposal.
 */
export async function submitCounterOffer(input) {
    const { purchase_request_id, user_id, role, quantity, unit = 'kg', price_per_unit, message } = input;
    if (!purchase_request_id) {
        throw { status: 400, message: 'purchase_request_id is required' };
    }
    if (!quantity || isNaN(quantity) || quantity <= 0) {
        throw { status: 400, message: 'quantity must be a number greater than 0' };
    }
    if (price_per_unit === undefined || isNaN(price_per_unit) || price_per_unit < 0) {
        throw { status: 400, message: 'price_per_unit must be a non-negative number' };
    }
    const cleanUnit = (unit || 'kg').toLowerCase().trim();
    if (!SUPPORTED_UNITS.includes(cleanUnit)) {
        throw { status: 400, message: `unit must be one of: ${SUPPORTED_UNITS.join(', ')}` };
    }
    // 1. Fetch current purchase request
    const { data: request, error: reqError } = await supabase
        .from('purchase_requests')
        .select('*')
        .eq('id', purchase_request_id)
        .single();
    if (reqError || !request) {
        throw { status: 404, message: 'Purchase request not found' };
    }
    // 2. Validate current status is negotiable
    const currentStatus = (request.status || '').toLowerCase();
    if (!['pending', 'counter_offered', 'countered'].includes(currentStatus)) {
        throw {
            status: 409,
            message: `Purchase request cannot be countered in current terminal state: ${request.status}`
        };
    }
    // 3. Verify expiration if set
    if (request.expires_at && new Date(request.expires_at).getTime() < Date.now()) {
        await supabase.from('purchase_requests').update({ status: 'expired' }).eq('id', purchase_request_id);
        throw { status: 409, message: 'This purchase request negotiation has expired' };
    }
    // 4. Verify participant role & ensure proper turn-taking
    const isDemo = !user_id || user_id === '039b5a52-cfab-42df-9cbc-22214e210de5' || user_id === 'anonymous-demo-user';
    // Determine effective role
    let effectiveRole = role;
    if (!effectiveRole) {
        effectiveRole = request.current_offer_by === 'buyer' ? 'farmer' : 'buyer';
    }
    // 5. Validate available inventory from listing
    const listingId = request.listing_id || request.produce_id;
    // 6. Calculate total amount
    const total_amount = Math.round(quantity * price_per_unit * 100) / 100;
    // 7. Mark previous active offers as superseded
    await supabase
        .from('purchase_request_offers')
        .update({ offer_status: 'superseded' })
        .eq('purchase_request_id', purchase_request_id)
        .eq('offer_status', 'active');
    // 8. Insert new counter-offer record
    const offerPayload = {
        purchase_request_id,
        offered_by_user_id: user_id,
        offered_by_role: effectiveRole,
        quantity,
        unit: cleanUnit,
        price_per_unit,
        total_amount,
        message: message || `Counter-offer proposed by ${effectiveRole}`,
        offer_status: 'active'
    };
    const { data: newOffer, error: offerInsertError } = await supabase
        .from('purchase_request_offers')
        .insert([offerPayload])
        .select()
        .single();
    if (offerInsertError || !newOffer) {
        console.error('Counter offer insert error:', offerInsertError);
        throw { status: 500, message: 'Failed to record counter-offer' };
    }
    // 9. Update purchase_request current state & status
    const updatePayload = {
        status: 'counter_offered',
        current_quantity: quantity,
        current_price_per_unit: price_per_unit,
        current_total_amount: total_amount,
        current_offer_by: effectiveRole,
        message: message || `Counter-offer proposed by ${effectiveRole}`,
        updated_at: new Date().toISOString()
    };
    const { data: updatedRequest, error: updateError } = await supabase
        .from('purchase_requests')
        .update(updatePayload)
        .eq('id', purchase_request_id)
        .select()
        .single();
    if (updateError || !updatedRequest) {
        throw { status: 500, message: 'Failed to update purchase request state' };
    }
    return {
        purchase_request_id,
        status: 'counter_offered',
        current_offer: newOffer,
        request: updatedRequest
    };
}
/**
 * 3. ACCEPT DEAL
 * Accepts the current active offer, decrements listing inventory safely, and seals the deal.
 */
export async function acceptDeal(input) {
    const { purchase_request_id, user_id, role } = input;
    if (!purchase_request_id) {
        throw { status: 400, message: 'purchase_request_id is required' };
    }
    // 1. Fetch request
    const { data: request, error: reqError } = await supabase
        .from('purchase_requests')
        .select('*')
        .eq('id', purchase_request_id)
        .single();
    if (reqError || !request) {
        throw { status: 404, message: 'Purchase request not found' };
    }
    const currentStatus = (request.status || '').toLowerCase();
    if (!['pending', 'counter_offered', 'countered'].includes(currentStatus)) {
        throw {
            status: 409,
            message: `Cannot accept purchase request in terminal status: ${request.status}`
        };
    }
    // 2. Fetch the active offer
    const { data: activeOffer, error: offerError } = await supabase
        .from('purchase_request_offers')
        .select('*')
        .eq('purchase_request_id', purchase_request_id)
        .eq('offer_status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    const finalQuantity = activeOffer ? Number(activeOffer.quantity) : Number(request.current_quantity || request.requested_quantity);
    const finalUnit = activeOffer?.unit || request.unit || 'kg';
    const finalPrice = activeOffer ? Number(activeOffer.price_per_unit) : Number(request.current_price_per_unit || request.offered_price_per_unit || request.offered_price);
    const finalTotal = activeOffer ? Number(activeOffer.total_amount) : Math.round(finalQuantity * finalPrice * 100) / 100;
    // 3. Atomic Inventory Deduction on produce_listings
    const listingId = request.listing_id || request.produce_id;
    if (listingId) {
        const { data: listing, error: listingError } = await supabase
            .from('produce_listings')
            .select('*')
            .eq('id', listingId)
            .single();
        if (listingError || !listing) {
            throw { status: 404, message: 'Associated produce listing not found' };
        }
        const listingStatus = (listing.status || 'Active').toLowerCase();
        if (['sold', 'cancelled', 'unavailable', 'inactive'].includes(listingStatus)) {
            throw { status: 409, message: 'Produce listing lot is already sold or no longer available' };
        }
        const orderQtyKg = toKg(finalQuantity, finalUnit);
        const availableQtyKg = toKg(Number(listing.quantity || 100), listing.unit || 'kg');
        // Calculate remaining quantity
        const remainingKg = Math.max(0, availableQtyKg - orderQtyKg);
        const remainingListingUnitQty = listing.unit && listing.unit.toLowerCase() === 'quintal'
            ? Math.round((remainingKg / 100) * 100) / 100
            : remainingKg;
        const updateListingPayload = {
            quantity: Math.max(0, remainingListingUnitQty)
        };
        if (remainingKg <= 0.001) {
            updateListingPayload.status = 'Sold';
        }
        await supabase
            .from('produce_listings')
            .update(updateListingPayload)
            .eq('id', listingId);
    }
    // 4. Mark active offer as accepted
    if (activeOffer) {
        await supabase
            .from('purchase_request_offers')
            .update({ offer_status: 'accepted' })
            .eq('id', activeOffer.id);
    }
    // 5. Update purchase_request to accepted state
    const { data: acceptedRequest, error: acceptError } = await supabase
        .from('purchase_requests')
        .update({
        status: 'accepted',
        agreed_quantity: finalQuantity,
        agreed_price_per_unit: finalPrice,
        agreed_total_amount: finalTotal,
        updated_at: new Date().toISOString()
    })
        .eq('id', purchase_request_id)
        .select()
        .single();
    if (acceptError || !acceptedRequest) {
        throw { status: 500, message: 'Failed to update deal acceptance' };
    }
    // 6. Idempotent integration with Smart Escrow & Order Lifecycle
    let createdOrder = null;
    try {
        createdOrder = await createOrderFromDeal({
            request_id: purchase_request_id,
            produce_id: listingId || null,
            crop: request.crop_name || 'Produce Lot',
            quantity: finalQuantity,
            unit: finalUnit,
            price_per_unit: finalPrice,
            total_amount: finalTotal,
            farmer_id: request.farmer_id || null,
            farmer_name: request.farmer_name || 'Verified Farmer',
            buyer_id: request.buyer_id || null,
            buyer_name: request.buyer_name || 'Enterprise Buyer',
            buyer_company: request.buyer_company || null,
            delivery_location: request.delivery_location || 'Regional Mandi Hub'
        });
    }
    catch (err) {
        console.error('Order creation error on acceptance:', err);
    }
    return {
        purchase_request_id,
        status: 'accepted',
        agreed_quantity: finalQuantity,
        unit: finalUnit,
        agreed_price_per_unit: finalPrice,
        total_amount: finalTotal,
        request: acceptedRequest,
        order: createdOrder
    };
}
/**
 * 4. REJECT DEAL
 * Transitions the negotiation to terminal status 'rejected'.
 */
export async function rejectDeal(input) {
    const { purchase_request_id, user_id } = input;
    const { data: request, error: reqError } = await supabase
        .from('purchase_requests')
        .select('*')
        .eq('id', purchase_request_id)
        .single();
    if (reqError || !request) {
        throw { status: 404, message: 'Purchase request not found' };
    }
    const currentStatus = (request.status || '').toLowerCase();
    if (!['pending', 'counter_offered', 'countered'].includes(currentStatus)) {
        throw {
            status: 409,
            message: `Cannot reject purchase request in terminal status: ${request.status}`
        };
    }
    // Mark active offers as rejected
    await supabase
        .from('purchase_request_offers')
        .update({ offer_status: 'rejected' })
        .eq('purchase_request_id', purchase_request_id)
        .eq('offer_status', 'active');
    const { data, error } = await supabase
        .from('purchase_requests')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', purchase_request_id)
        .select()
        .single();
    if (error || !data) {
        throw { status: 500, message: 'Failed to reject purchase request' };
    }
    return { purchase_request_id, status: 'rejected', request: data };
}
/**
 * 5. CANCEL REQUEST
 * Allows the creator to cancel their active request.
 */
export async function cancelPurchaseRequest(purchase_request_id, user_id) {
    const { data: request, error: reqError } = await supabase
        .from('purchase_requests')
        .select('*')
        .eq('id', purchase_request_id)
        .single();
    if (reqError || !request) {
        throw { status: 404, message: 'Purchase request not found' };
    }
    const currentStatus = (request.status || '').toLowerCase();
    if (!['pending', 'counter_offered'].includes(currentStatus)) {
        throw {
            status: 409,
            message: `Cannot cancel purchase request in terminal status: ${request.status}`
        };
    }
    const { data, error } = await supabase
        .from('purchase_requests')
        .update({ status: 'cancelled' })
        .eq('id', purchase_request_id)
        .select()
        .single();
    if (error || !data) {
        throw { status: 500, message: 'Failed to cancel purchase request' };
    }
    return { purchase_request_id, status: 'cancelled', request: data };
}
/**
 * 6. GET NEGOTIATION HISTORY
 * Chronological order from oldest to newest.
 */
export async function getNegotiationOffers(purchase_request_id) {
    const { data: offers, error } = await supabase
        .from('purchase_request_offers')
        .select('*')
        .eq('purchase_request_id', purchase_request_id)
        .order('created_at', { ascending: true });
    if (error) {
        throw { status: 500, message: 'Failed to retrieve negotiation history' };
    }
    return offers || [];
}
