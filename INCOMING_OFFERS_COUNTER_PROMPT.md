# PROMPT: Implement Incoming Offers & Farmer Counter-Offer Negotiation System

Copy and paste the entire prompt below into ChatGPT, Claude, Gemini, Cursor, or any AI coding assistant to replicate the exact Fieldora 2.0 incoming offer and counter-offer negotiation system in your project.

---

```text
Act as a Principal Full-Stack React & UI/UX Engineer. Implement a complete, pixel-perfect "Incoming Purchase Offers & Farmer Counter-Offer Negotiation" page and system in React + TypeScript + Tailwind CSS with Lucide Icons.

The feature must look and behave EXACTLY like the enterprise agricultural B2B platform described below.

--------------------------------------------------------------------------------
1. DATA STRUCTURES & TYPES
--------------------------------------------------------------------------------
Define the following TypeScript interfaces and types:

export type RequestStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Countered';

export interface PurchaseRequest {
  id: string;
  produceId: string;
  cropName: string;
  buyerId: string;
  buyerName: string;
  buyerCompany: string;
  isBuyerVerified: boolean;
  farmerId: string;
  farmerName: string;
  requestedQuantity: number;
  unit: string; // e.g. "quintal", "kg", "ton"
  offeredPrice: number; // in INR (₹)
  deliveryLocation: string;
  requiredDate: string; // e.g. "2026-09-18"
  message?: string;
  counterPrice?: number;
  counterQuantity?: number;
  counterMessage?: string;
  status: RequestStatus;
  createdDate: string;
}

export interface OrderItem {
  id: string;
  orderNumber: string; // e.g. "FD-4821"
  requestId?: string;
  produceId: string;
  crop: string;
  variety: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalAmount: number;
  farmerId: string;
  farmerName: string;
  farmerFarm: string;
  buyerId: string;
  buyerName: string;
  buyerCompany: string;
  deliveryLocation: string;
  orderDate: string;
  expectedDeliveryDate: string;
  status: 'Confirmed' | 'Harvested' | 'In Transit' | 'Delivered' | 'Completed';
  paymentStatus: 'Escrow Locked' | 'Released' | 'Pending';
}

--------------------------------------------------------------------------------
2. WORKFLOWS & STATE TRANSITIONS
--------------------------------------------------------------------------------
The user interface must support 3 primary farmer actions on each incoming request card:

1. ACCEPT OFFER:
   - Sets request status from 'Pending' to 'Accepted'.
   - Generates a new Order with status 'Confirmed' and paymentStatus 'Escrow Locked'.
   - Replaces action buttons with a green "This request has been accepted" message and a link to view in the Orders tab.

2. DECLINE / REJECT OFFER:
   - Sets request status from 'Pending' to 'Rejected'.
   - Replaces action buttons with "This request has been rejected".

3. COUNTER-OFFER NEGOTIATION (MODAL):
   - Opens a backdrop-blurred modal pre-populated with the buyer's original price and quantity.
   - Shows:
     a) Commodity name & Buyer's Initial Asking Rate (highlighted in red).
     b) Input for "Your Counter Asking Rate (₹/unit)".
     c) Input for "Offered Quantity (units)".
     d) Live auto-calculated "New Total Contract Value" = (counterPrice * counterQty).
     e) Optional Textarea for "Message / Reason for Counter".
   - On submission:
     - Updates request status to 'Countered'.
     - Stores counterPrice, counterQuantity, and counterMessage.
     - Closes modal.
     - The request card immediately displays an amber banner:
       "Your Counter-Offer Submitted: ₹[counterPrice]/q ([counterQuantity] units)" along with the optional note and "Awaiting confirmation from [Buyer Company]."

--------------------------------------------------------------------------------
3. DESIGN & STYLING SPECIFICATIONS (Tailwind CSS)
--------------------------------------------------------------------------------
- Colors:
  - Primary / Brand: Emerald/Forest Green (bg-emerald-600, text-emerald-700, border-emerald-200, bg-emerald-50)
  - Amber / Counter: (bg-amber-50, border-amber-300, text-amber-900)
  - Rose / Decline: (text-rose-600, border-rose-200, hover:bg-rose-50)
  - Neutral / Card: White cards with rounded-2xl, border border-slate-200, subtle hover border highlight
- Layout:
  - Header: Title "Incoming Purchase Requests & Counter-Offers" + subtitle description.
  - Empty State: Centered icon, title, message, and action button if no requests exist.
  - Card Header: Buyer company name + "Verified Buyer" pill with BadgeCheck icon, contact name, creation date, Offered Rate in large green font, and StatusBadge pill.
  - Specs 2-3 Column Grid (bg-slate-50):
    1) Commodity Lot
    2) Requested Volume
    3) Total Contract Value = ₹(quantity * offeredPrice)
    4) Delivery Hub
    5) Required By Date
    6) Payment Mode ("100% Smart Escrow Payout")
  - Buyer Note block: Italicized container if message is present.
  - Action footer: Decline button, Counter Offer button (with MessageSquare icon), and Accept button (with Check icon).

--------------------------------------------------------------------------------
4. COMPLETE REACT COMPONENT CODE (BuyerRequestsPage.tsx)
--------------------------------------------------------------------------------
Here is the complete, drop-in ready component:

import React, { useState } from 'react';
import { 
  Inbox, Check, X, BadgeCheck, IndianRupee, MapPin, 
  Calendar, Scale, ArrowRight, MessageSquare, Send, Sparkles 
} from 'lucide-react';

export const BuyerRequestsPage: React.FC = () => {
  // Initial Mock State (can be wired to your context or API)
  const [requestsList, setRequestsList] = useState<PurchaseRequest[]>([
    {
      id: 'REQ-101',
      produceId: 'PROD-01',
      cropName: 'Alphonso Mango (Ratnagiri Export Grade)',
      buyerId: 'BUYER-01',
      buyerName: 'Vikram Mehta',
      buyerCompany: 'FreshBazaar Hypermarkets Ltd.',
      isBuyerVerified: true,
      farmerId: 'FARMER-01',
      farmerName: 'Ramesh Patil',
      requestedQuantity: 50,
      unit: 'quintal',
      offeredPrice: 8500,
      deliveryLocation: 'Vashi APMC Hub, Navi Mumbai',
      requiredDate: '2026-09-18',
      message: 'Need Grade-A export certified lot with pesticide-free documentation.',
      status: 'Pending',
      createdDate: '2026-09-10',
    },
    {
      id: 'REQ-102',
      produceId: 'PROD-02',
      cropName: 'Nashik Red Onion (Medium-Large)',
      buyerId: 'BUYER-02',
      buyerName: 'Anil Deshmukh',
      buyerCompany: 'MahaAgri Wholesale Traders',
      isBuyerVerified: true,
      farmerId: 'FARMER-01',
      farmerName: 'Ramesh Patil',
      requestedQuantity: 120,
      unit: 'quintal',
      offeredPrice: 2200,
      deliveryLocation: 'APMC Market Yard, Pune',
      requiredDate: '2026-09-15',
      message: 'Immediate dispatch required. Transport handled by buyer.',
      status: 'Pending',
      createdDate: '2026-09-09',
    }
  ]);

  // Counter Modal State
  const [selectedReq, setSelectedReq] = useState<PurchaseRequest | null>(null);
  const [counterPrice, setCounterPrice] = useState<string>('');
  const [counterQty, setCounterQty] = useState<string>('');
  const [counterMsg, setCounterMsg] = useState<string>('');

  const openCounterModal = (req: PurchaseRequest) => {
    setSelectedReq(req);
    setCounterPrice(req.offeredPrice.toString());
    setCounterQty(req.requestedQuantity.toString());
    setCounterMsg('');
  };

  const closeCounterModal = () => {
    setSelectedReq(null);
  };

  const handleAccept = (id: string) => {
    setRequestsList(prev => prev.map(r => r.id === id ? { ...r, status: 'Accepted' } : r));
  };

  const handleReject = (id: string) => {
    setRequestsList(prev => prev.map(r => r.id === id ? { ...r, status: 'Rejected' } : r));
  };

  const handleCounterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    const price = parseFloat(counterPrice) || selectedReq.offeredPrice;
    const qty = parseFloat(counterQty) || selectedReq.requestedQuantity;

    setRequestsList(prev => prev.map(r => r.id === selectedReq.id ? {
      ...r,
      status: 'Countered',
      counterPrice: price,
      counterQuantity: qty,
      counterMessage: counterMsg
    } : r));

    closeCounterModal();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Incoming Purchase Requests & Counter-Offers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Review formal offers from verified buyers. Accept directly or submit counter rates with escrow milestones.
          </p>
        </div>
      </div>

      {requestsList.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
          <Inbox className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No incoming purchase requests</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            When institutional buyers place purchase offers on your produce lots, they will appear here with price terms and delivery specs.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requestsList.map((req) => (
            <div 
              key={req.id} 
              className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm hover:border-emerald-500/50 transition-all"
            >
              
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-slate-900">{req.buyerCompany}</span>
                    {req.isBuyerVerified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-full border border-emerald-200">
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Buyer
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Contact: {req.buyerName} • Received: {req.createdDate}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold block">Offered Rate</span>
                    <span className="text-xl font-bold font-mono text-emerald-700">
                      ₹{req.offeredPrice.toLocaleString('en-IN')}/{req.unit === 'quintal' ? 'q' : req.unit}
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                    req.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                    req.status === 'Accepted' ? 'bg-emerald-100 text-emerald-800' :
                    req.status === 'Countered' ? 'bg-blue-100 text-blue-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {req.status}
                  </span>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[11px]">Commodity Lot</span>
                  <span className="font-bold text-slate-800">{req.cropName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Requested Volume</span>
                  <span className="font-bold text-slate-800">{req.requestedQuantity} {req.unit}s</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Total Contract Value</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    ₹{(req.requestedQuantity * req.offeredPrice).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Delivery Hub</span>
                  <span className="font-semibold text-slate-800 truncate block">{req.deliveryLocation}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Required By Date</span>
                  <span className="font-semibold text-slate-800">{req.requiredDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Payment Mode</span>
                  <span className="font-semibold text-emerald-600">100% Smart Escrow Payout</span>
                </div>
              </div>

              {/* Buyer Note */}
              {req.message && (
                <div className="text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100 italic">
                  <strong>Buyer Note:</strong> "{req.message}"
                </div>
              )}

              {/* Counter-Offer Banner */}
              {req.status === 'Countered' && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-amber-900">
                    <span>Your Counter-Offer Submitted</span>
                    <span className="font-mono">
                      ₹{req.counterPrice?.toLocaleString('en-IN')}/{req.unit === 'quintal' ? 'q' : req.unit} ({req.counterQuantity} {req.unit}s)
                    </span>
                  </div>
                  {req.counterMessage && (
                    <p className="text-slate-600 italic">"{req.counterMessage}"</p>
                  )}
                  <p className="text-[11px] text-amber-700">Awaiting confirmation from {req.buyerCompany}.</p>
                </div>
              )}

              {/* Action Buttons */}
              {req.status === 'Pending' ? (
                <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleReject(req.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 border border-rose-200 hover:bg-rose-50 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Decline Request
                  </button>
                  <button
                    onClick={() => openCounterModal(req)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-300 hover:bg-amber-100 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-amber-700" /> Counter Offer
                  </button>
                  <button
                    onClick={() => handleAccept(req.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <Check className="w-4 h-4" /> Accept Offer & Create Order
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <span>This request has been <strong>{req.status.toLowerCase()}</strong>.</span>
                  {req.status === 'Accepted' && (
                    <a href="#/orders" className="text-emerald-700 font-bold hover:underline flex items-center gap-1">
                      <span>Track in Orders</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}

            </div>
          ))}
        </div>
      )}

      {/* Interactive Farmer Counter-Offer Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" /> Counter-Offer Negotiation
                </h3>
                <p className="text-xs text-slate-500">
                  Propose custom price terms to {selectedReq.buyerCompany}
                </p>
              </div>
              <button onClick={closeCounterModal} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCounterSubmit} className="space-y-4 text-xs">
              
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Commodity:</span>
                  <strong className="text-slate-800">{selectedReq.cropName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Buyer's Initial Offer:</span>
                  <span className="font-mono font-bold text-rose-600">
                    ₹{selectedReq.offeredPrice.toLocaleString('en-IN')}/{selectedReq.unit === 'quintal' ? 'q' : selectedReq.unit}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Your Counter Asking Rate (₹/{selectedReq.unit === 'quintal' ? 'q' : selectedReq.unit}) *
                  </label>
                  <input
                    type="number"
                    required
                    value={counterPrice}
                    onChange={(e) => setCounterPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Offered Quantity ({selectedReq.unit}s) *
                  </label>
                  <input
                    type="number"
                    required
                    value={counterQty}
                    onChange={(e) => setCounterQty(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                <span className="text-slate-600 font-medium">New Total Contract Value:</span>
                <span className="text-base font-bold font-mono text-emerald-700">
                  ₹{((parseFloat(counterPrice) || 0) * (parseFloat(counterQty) || 0)).toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Message / Reason for Counter (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Higher grade export batch, immediate dispatch available..."
                  value={counterMsg}
                  onChange={(e) => setCounterMsg(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeCounterModal}
                  className="px-3 py-1.5 rounded-xl font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all"
                >
                  <Send className="w-3.5 h-3.5" /> Transmit Counter-Offer
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
```
```
