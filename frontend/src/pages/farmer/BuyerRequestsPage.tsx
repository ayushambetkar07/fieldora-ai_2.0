import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PurchaseRequest } from '../../types';
import { Inbox, Check, X, BadgeCheck, IndianRupee, MapPin, Calendar, Scale, ArrowRight, MessageSquare, Send, Sparkles } from 'lucide-react';
import { Card, Button, StatusBadge, Input, Textarea } from '../../components/ui';
import { EmptyState } from '../../components/ui/feedback';
import { Link } from 'react-router-dom';

export const BuyerRequestsPage: React.FC = () => {
  const { currentFarmer, requestsList, acceptRequest, rejectRequest, counterRequest } = useApp();
  const myRequests = requestsList.filter(r => r.farmerId === currentFarmer.id);

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

  const handleCounterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    const price = parseFloat(counterPrice) || selectedReq.offeredPrice;
    const qty = parseFloat(counterQty) || selectedReq.requestedQuantity;

    await counterRequest(selectedReq.id, price, qty, counterMsg);
    closeCounterModal();
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-main tracking-tight">
            Incoming Purchase Requests & Counter-Offers
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            Review formal offers from verified buyers. Accept directly or submit counter rates with escrow milestones.
          </p>
        </div>
      </div>

      {myRequests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No incoming purchase requests"
          description="When institutional buyers place purchase offers on your produce lots, they will appear here with price terms and delivery specs."
          actionLabel="View My Produce"
          onAction={() => window.location.href = '#/farmer/produce'}
        />
      ) : (
        <div className="space-y-4">
          {myRequests.map((req) => (
            <Card key={req.id} className="p-6 space-y-4 hover:border-primary/40 transition-colors">
              
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-main">{req.buyerCompany}</span>
                    {req.isBuyerVerified && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-accent-light text-primary text-[11px] font-semibold rounded-full border border-[#bbf7d0]">
                        <BadgeCheck className="w-3 h-3 text-accent" /> Verified Buyer
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-secondary mt-0.5">
                    Contact: {req.buyerName} • Received: {req.createdDate}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[11px] text-muted uppercase font-semibold block">Offered Rate</span>
                    <span className="text-xl font-bold font-mono text-primary">
                      ₹{req.offeredPrice.toLocaleString('en-IN')}/q
                    </span>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-[#F7F9F6] p-3.5 rounded-input border border-border">
                <div>
                  <span className="text-muted block text-[11px]">Commodity Lot</span>
                  <span className="font-bold text-main">{req.cropName}</span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Requested Volume</span>
                  <span className="font-bold text-main">{req.requestedQuantity} {req.unit}s</span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Total Contract Value</span>
                  <span className="font-bold text-primary font-mono">
                    ₹{(req.requestedQuantity * req.offeredPrice).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Delivery Hub</span>
                  <span className="font-semibold text-main truncate block">{req.deliveryLocation}</span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Required By Date</span>
                  <span className="font-semibold text-main">{req.requiredDate}</span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Payment Mode</span>
                  <span className="font-semibold text-accent">100% Smart Escrow Payout</span>
                </div>
              </div>

              {req.message && (
                <div className="text-xs text-secondary bg-[#FAFCFA] p-3 rounded-input border border-border italic">
                  <strong>Buyer Note:</strong> "{req.message}"
                </div>
              )}

              {/* Counter details banner if countered */}
              {req.status === 'Countered' && (
                <div className="bg-[#FEF3C7]/40 border border-[#FDE68A] p-3 rounded-input text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-[#92400E]">
                    <span>Your Counter-Offer Submitted</span>
                    <span className="font-mono">₹{req.counterPrice?.toLocaleString('en-IN')}/q ({req.counterQuantity} {req.unit}s)</span>
                  </div>
                  {req.counterMessage && (
                    <p className="text-secondary italic">"{req.counterMessage}"</p>
                  )}
                  <p className="text-[11px] text-muted">Awaiting confirmation from {req.buyerCompany}.</p>
                </div>
              )}

              {/* Action Buttons */}
              {req.status === 'Pending' ? (
                <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => rejectRequest(req.id)}
                    className="text-error hover:bg-error-light hover:border-error"
                  >
                    <X className="w-3.5 h-3.5 mr-1" />
                    Decline Request
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openCounterModal(req)}
                    className="border-amber-400 text-amber-900 bg-amber-50 hover:bg-amber-100"
                  >
                    <MessageSquare className="w-3.5 h-3.5 mr-1 text-amber-700" />
                    Counter Offer
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => acceptRequest(req.id)}
                    className="shadow-card"
                  >
                    <Check className="w-4 h-4 mr-1.5" />
                    Accept Offer & Create Order
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-secondary">
                  <span>This request has been <strong>{req.status.toLowerCase()}</strong>.</span>
                  {req.status === 'Accepted' && (
                    <Link to="/farmer/orders" className="text-primary font-bold hover:underline flex items-center gap-1">
                      <span>Track in Orders</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              )}

            </Card>
          ))}
        </div>
      )}

      {/* Interactive Farmer Counter-Offer Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-scale-in border border-border">
            
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-lg text-main flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-accent" /> Counter-Offer Negotiation
                </h3>
                <p className="text-xs text-secondary">
                  Propose custom price terms to {selectedReq.buyerCompany}
                </p>
              </div>
              <button onClick={closeCounterModal} className="text-muted hover:text-main p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCounterSubmit} className="space-y-4 text-xs">
              
              <div className="bg-[#F7F9F6] p-3 rounded-input border border-border space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-secondary">Commodity:</span>
                  <strong>{selectedReq.cropName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Buyer's Initial Offer:</span>
                  <span className="font-mono font-bold text-error">₹{selectedReq.offeredPrice.toLocaleString('en-IN')}/q</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Your Counter Asking Rate (₹/q) *"
                  type="number"
                  required
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value)}
                />
                <Input
                  label="Offered Quantity *"
                  type="number"
                  required
                  value={counterQty}
                  onChange={(e) => setCounterQty(e.target.value)}
                />
              </div>

              <div className="p-3 bg-accent-light/50 border border-[#bbf7d0] rounded-input flex items-center justify-between">
                <span className="text-secondary font-medium">New Total Contract Value:</span>
                <span className="text-base font-bold font-mono text-primary">
                  ₹{((parseFloat(counterPrice) || 0) * (parseFloat(counterQty) || 0)).toLocaleString('en-IN')}
                </span>
              </div>

              <Textarea
                label="Message / Reason for Counter (Optional)"
                rows={2}
                placeholder="e.g. Higher grade export batch, immediate dispatch available..."
                value={counterMsg}
                onChange={(e) => setCounterMsg(e.target.value)}
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={closeCounterModal}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" className="shadow-card">
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Transmit Counter-Offer
                </Button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
