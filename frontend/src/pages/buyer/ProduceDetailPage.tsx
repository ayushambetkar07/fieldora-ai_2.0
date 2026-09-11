import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { MOCK_MARKET_PRICES } from '../../data/mockData';
import { 
  ArrowLeft, 
  BadgeCheck, 
  MapPin, 
  Scale, 
  CalendarDays, 
  Truck, 
  Send, 
  ShieldCheck, 
  TrendingUp, 
  Sparkles, 
  CheckCircle2,
  FileCheck2,
  X
} from 'lucide-react';
import { Button, Card, StatusBadge, Input } from '../../components/ui';
import { getCropImage, getCropByName } from '../../data/cropMaster';

export const ProduceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { produceList, sendPurchaseRequest } = useApp();

  const produce = produceList.find(p => p.id === id) || produceList[0];
  const marketBenchmark = MOCK_MARKET_PRICES.find(m => m.crop.toLowerCase() === produce.crop.toLowerCase()) || MOCK_MARKET_PRICES[0];

  // Contact Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [reqQty, setReqQty] = useState(produce.quantity.toString());
  const [reqOfferPrice, setReqOfferPrice] = useState(produce.expectedPrice.toString());
  const [reqLocation, setReqLocation] = useState('Mumbai Central Distribution Center');
  const [reqDate, setReqDate] = useState('2026-09-08');
  const [reqMessage, setReqMessage] = useState(`Looking to contract ${produce.quantity} ${produce.unit}s with full assay verification.`);

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    sendPurchaseRequest({
      produceId: produce.id,
      cropName: produce.crop,
      farmerId: produce.farmerId,
      farmerName: produce.farmerName,
      requestedQuantity: parseFloat(reqQty) || produce.quantity,
      unit: produce.unit,
      offeredPrice: parseFloat(reqOfferPrice) || produce.expectedPrice,
      deliveryLocation: reqLocation,
      requiredDate: reqDate,
      message: reqMessage,
    });
    setModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-main"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Marketplace
      </button>

      {/* Main Produce Hero Card */}
      <div className="bg-card border border-border rounded-card overflow-hidden shadow-card grid grid-cols-1 lg:grid-cols-12 gap-0">
        
        {/* Left Image Section */}
        <div className="lg:col-span-5 relative h-72 lg:h-full bg-[#EAEFEA] min-h-[300px]">
          <img
            src={getCropImage(produce.crop, produce.imageUrl)}
            alt={produce.crop}
            className="w-full h-full object-cover"
            onError={(e) => {
              const fallback = getCropByName(produce.crop)?.fallbackImage || '/images/crops/tomato.jpg';
              if ((e.currentTarget as HTMLImageElement).src !== fallback) {
                (e.currentTarget as HTMLImageElement).src = fallback;
              }
            }}
          />
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="px-3 py-1 bg-white/95 backdrop-blur-xs text-primary font-bold text-xs rounded-full shadow-xs">
              {produce.crop}
            </span>
            <span className="px-2.5 py-1 bg-primary text-white text-xs font-semibold rounded-full shadow-xs">
              {produce.quality}
            </span>
          </div>
        </div>

        {/* Right Info Section */}
        <div className="lg:col-span-7 p-6 sm:p-8 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                  {produce.category} • {produce.location}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-main tracking-tight mt-1">
                {produce.variety}
              </h1>
              
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-secondary font-medium">Producer:</span>
                <span className="text-xs font-bold text-main">{produce.farmerName}</span>
                {produce.isFarmerVerified && (
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-accent">
                    <BadgeCheck className="w-3.5 h-3.5" /> Verified FPO
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-secondary leading-relaxed bg-[#F7F9F6] p-3.5 rounded-input border border-border">
              {produce.description}
            </p>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#FAFCFA] p-3 rounded-input border border-border space-y-0.5">
                <span className="text-muted block text-[11px]">Available Volume</span>
                <strong className="text-main font-mono text-sm">{produce.quantity} {produce.unit}s</strong>
              </div>

              <div className="bg-[#FAFCFA] p-3 rounded-input border border-border space-y-0.5">
                <span className="text-muted block text-[11px]">Harvest Date</span>
                <strong className="text-main">{produce.harvestDate}</strong>
              </div>

              <div className="bg-[#FAFCFA] p-3 rounded-input border border-border space-y-0.5">
                <span className="text-muted block text-[11px]">Dispatch Logistics</span>
                <strong className="text-main truncate block">{produce.deliveryOption}</strong>
              </div>
            </div>
          </div>

          {/* Pricing & CTA */}
          <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] text-muted uppercase font-semibold block">Asking Price</span>
              <div className="text-2xl font-bold text-primary font-mono">
                ₹{produce.expectedPrice.toLocaleString('en-IN')}{' '}
                <span className="text-xs font-normal text-secondary">/{produce.unit === 'quintal' ? 'q' : produce.unit}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setModalOpen(true)}
                className="w-full sm:w-auto shadow-card"
              >
                <Send className="w-4 h-4 mr-2" />
                <span>Send Purchase Request</span>
              </Button>
            </div>
          </div>

        </div>

      </div>

      {/* 2. MARKET PRICE BENCHMARK COMPARISON TABLE */}
      <Card className="p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-main">Market Reference Comparison</h2>
            <p className="text-xs text-secondary">Benchmark this farm asking rate against live APMC Mandi auction spot prices</p>
          </div>
          <span className="text-xs font-bold text-primary bg-accent-light px-2.5 py-1 rounded-full border border-[#bbf7d0]">
            Mandi Parity Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F7F9F6] text-secondary uppercase font-semibold border-b border-border">
              <tr>
                <th className="py-3 px-4">Market / Source</th>
                <th className="py-3 px-4">Rate (₹/Quintal)</th>
                <th className="py-3 px-4">Price Difference</th>
                <th className="py-3 px-4">Quality Standard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium text-main">
              <tr className="bg-[#F0FDF4] font-bold text-primary">
                <td className="py-3.5 px-4 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span>This Fieldora Listing ({produce.farmerName})</span>
                </td>
                <td className="py-3.5 px-4 font-mono text-sm">
                  ₹{produce.expectedPrice.toLocaleString('en-IN')}/q
                </td>
                <td className="py-3.5 px-4 text-accent">
                  Direct Farm-Gate Rate
                </td>
                <td className="py-3.5 px-4">
                  {produce.quality} (Lab Certified)
                </td>
              </tr>
              {marketBenchmark.nearbyMarkets.map((m, idx) => {
                const diff = produce.expectedPrice - m.price;
                return (
                  <tr key={idx} className="hover:bg-[#F7F9F6] transition-colors">
                    <td className="py-3.5 px-4 flex items-center gap-1.5 text-main font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-muted" />
                      <span>{m.mandi}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-main">
                      ₹{m.price.toLocaleString('en-IN')}/q
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {diff === 0 ? (
                        <span className="text-secondary font-medium">Exact Parity</span>
                      ) : diff > 0 ? (
                        <span className="text-error font-medium">+₹{diff}/q vs mandi</span>
                      ) : (
                        <span className="text-accent font-medium">-₹{Math.abs(diff)}/q (Cost Saving)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-secondary">
                      APMC Mixed Modal Grade
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Purchase Request Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs" 
            onClick={() => setModalOpen(false)}
          />

          <Card className="relative z-10 max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-fade-in bg-white">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Issue Purchase Offer</span>
                <h3 className="text-lg font-bold text-main">{produce.crop} ({produce.variety})</h3>
                <p className="text-xs text-secondary mt-0.5">
                  Direct to: <strong>{produce.farmerName}</strong>
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-secondary hover:text-main p-1 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={`Quantity (${produce.unit}s) *`}
                  type="number"
                  min="1"
                  max={produce.quantity}
                  value={reqQty}
                  onChange={(e) => setReqQty(e.target.value)}
                  required
                />
                <Input
                  label="Offered Rate (₹/q) *"
                  type="number"
                  min="500"
                  value={reqOfferPrice}
                  onChange={(e) => setReqOfferPrice(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Destination Delivery Hub *"
                type="text"
                value={reqLocation}
                onChange={(e) => setReqLocation(e.target.value)}
                required
              />

              <Input
                label="Required By Date *"
                type="date"
                value={reqDate}
                onChange={(e) => setReqDate(e.target.value)}
                required
              />

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-main uppercase">Procurement Specifications</label>
                <textarea
                  rows={2}
                  value={reqMessage}
                  onChange={(e) => setReqMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-border rounded-input text-xs text-main"
                />
              </div>

              <div className="bg-[#F0FDF4] border border-[#bbf7d0] p-3 rounded-input text-[11px] text-secondary flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span>Smart Escrow Settlement: Funds are locked safely and released only upon your electronic weighbridge & assay sign-off.</span>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" className="shadow-card">
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Transmit Purchase Offer
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

    </div>
  );
};
