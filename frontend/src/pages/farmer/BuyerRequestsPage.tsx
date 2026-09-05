import React from 'react';
import { useApp } from '../../context/AppContext';
import { Inbox, Check, X, BadgeCheck, IndianRupee, MapPin, Calendar, Scale, ArrowRight } from 'lucide-react';
import { Card, Button, StatusBadge } from '../../components/ui';
import { EmptyState } from '../../components/ui/feedback';
import { Link } from 'react-router-dom';

export const BuyerRequestsPage: React.FC = () => {
  const { currentFarmer, requestsList, acceptRequest, rejectRequest } = useApp();
  const myRequests = requestsList.filter(r => r.farmerId === currentFarmer.id);

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-main tracking-tight">
            Incoming Purchase Requests
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            Review formal offers from verified buyers. Accepting a request generates a milestone escrow contract.
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

              {/* Action Buttons */}
              {req.status === 'Pending' ? (
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
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

    </div>
  );
};
