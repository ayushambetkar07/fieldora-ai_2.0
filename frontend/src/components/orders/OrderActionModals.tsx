import React, { useState } from 'react';
import { OrderItem } from '../../types';
import { 
  X, 
  MapPin, 
  Scale, 
  ShieldCheck, 
  IndianRupee, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  FileCheck
} from 'lucide-react';
import { Button } from '../ui';

// =========================================================================
// 1. SHIPMENT ARRIVAL MODAL (BUTTON 1)
// =========================================================================
interface ShipmentArrivalModalProps {
  order: OrderItem;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (remarks: string) => Promise<void>;
}

export const ShipmentArrivalModal: React.FC<ShipmentArrivalModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm(remarks);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentDateStr = new Date().toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-border">
        
        {/* Header */}
        <div className="bg-[#166534] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#4ade80]" />
            <h3 className="font-bold text-lg">Shipment Arrival</h3>
          </div>
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          
          <div className="bg-[#F7F9F6] p-4 rounded-xl border border-border space-y-3">
            <div className="flex justify-between items-center border-b border-border/60 pb-2">
              <span className="text-xs text-muted font-medium uppercase">Order Reference</span>
              <span className="font-mono font-bold text-primary">{order.orderNumber}</span>
            </div>

            <div className="flex justify-between items-center border-b border-border/60 pb-2">
              <span className="text-xs text-muted font-medium uppercase">Produce Lot</span>
              <span className="font-bold text-main">{order.crop} ({order.variety})</span>
            </div>

            <div className="flex justify-between items-center border-b border-border/60 pb-2">
              <span className="text-xs text-muted font-medium uppercase">Expected Quantity</span>
              <span className="font-bold text-main">{order.quantity} {order.unit}s</span>
            </div>

            <div className="flex justify-between items-center border-b border-border/60 pb-2">
              <span className="text-xs text-muted font-medium uppercase">Destination Hub</span>
              <span className="font-medium text-main text-right">{order.deliveryLocation}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-muted font-medium uppercase">Actual Arrival Date</span>
              <span className="font-mono text-xs font-semibold text-secondary">{currentDateStr}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-secondary uppercase">
              Arrival Remarks <span className="text-muted font-normal lowercase">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g., Consignment arrived at Vashi Hub in good condition, vehicle seals intact."
              className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="bg-[#166534] hover:bg-[#14532d] flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Marking Arrived...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#4ade80]" />
                  <span>Confirm Arrival</span>
                </>
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};

// =========================================================================
// 2. QUALITY & WEIGHMENT VERIFICATION MODAL (BUTTON 2)
// =========================================================================
interface QualityVerificationModalProps {
  order: OrderItem;
  isOpen: boolean;
  onClose: () => void;
  onVerify: (data: {
    actualReceivedQuantity: number;
    actualQuantityUnit: string;
    qualityGrade: string;
    assayResult: string;
    assayNotes?: string;
    verificationRemarks?: string;
  }) => Promise<void>;
  verifierName?: string;
}

export const QualityVerificationModal: React.FC<QualityVerificationModalProps> = ({
  order,
  isOpen,
  onClose,
  onVerify,
  verifierName = 'Fieldora Quality Inspector'
}) => {
  const [actualQuantity, setActualQuantity] = useState<string>(order.quantity.toString());
  const [unit, setUnit] = useState<string>(order.unit || 'kg');
  const [qualityGrade, setQualityGrade] = useState<string>('Grade A');
  const [assayResult, setAssayResult] = useState<string>('Passed');
  const [assayNotes, setAssayNotes] = useState<string>('');
  const [verificationRemarks, setVerificationRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedQty = parseFloat(actualQuantity);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setFormError('Please enter a valid actual received quantity greater than 0.');
      return;
    }

    if (!qualityGrade) {
      setFormError('Quality grade selection is required.');
      return;
    }

    if (!assayResult) {
      setFormError('Assay result selection is required.');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onVerify({
        actualReceivedQuantity: parsedQty,
        actualQuantityUnit: unit,
        qualityGrade,
        assayResult,
        assayNotes,
        verificationRemarks
      });
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Verification failed. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentDateStr = new Date().toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-border my-8">
        
        {/* Header */}
        <div className="bg-[#166534] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#4ade80]" />
            <h3 className="font-bold text-lg">Quality & Weighment Verification</h3>
          </div>
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="bg-[#F7F9F6] p-4 rounded-xl border border-border space-y-2.5">
            <div className="flex justify-between items-center border-b border-border/60 pb-1.5">
              <span className="text-xs text-muted font-medium uppercase">Order</span>
              <span className="font-mono font-bold text-primary">{order.orderNumber}</span>
            </div>

            <div className="flex justify-between items-center border-b border-border/60 pb-1.5">
              <span className="text-xs text-muted font-medium uppercase">Produce</span>
              <span className="font-bold text-main">{order.crop} ({order.variety})</span>
            </div>

            <div className="flex justify-between items-center border-b border-border/60 pb-1.5">
              <span className="text-xs text-muted font-medium uppercase">Expected Quantity</span>
              <span className="font-bold text-main">{order.quantity} {order.unit}s</span>
            </div>

            <div className="flex justify-between items-center border-b border-border/60 pb-1.5">
              <span className="text-xs text-muted font-medium uppercase">Verifier</span>
              <span className="font-semibold text-main">{verifierName}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-muted font-medium uppercase">Verification Time</span>
              <span className="font-mono text-xs text-secondary">{currentDateStr}</span>
            </div>
          </div>

          {/* Actual Received Quantity */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold text-secondary uppercase">
                Actual Received Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={actualQuantity}
                onChange={(e) => setActualQuantity(e.target.value)}
                placeholder={`e.g., ${order.quantity}`}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-secondary uppercase">
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="kg">kg</option>
                <option value="quintal">quintal</option>
                <option value="ton">ton</option>
              </select>
            </div>
          </div>

          {/* Quality Grade & Assay Result */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-secondary uppercase">
                Quality Grade <span className="text-red-500">*</span>
              </label>
              <select
                value={qualityGrade}
                onChange={(e) => setQualityGrade(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="Grade A">Grade A</option>
                <option value="Grade B">Grade B</option>
                <option value="Grade C">Grade C</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-secondary uppercase">
                Assay Result <span className="text-red-500">*</span>
              </label>
              <select
                value={assayResult}
                onChange={(e) => setAssayResult(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold"
              >
                <option value="Passed" className="text-green-700 font-bold">Passed</option>
                <option value="Failed" className="text-red-700 font-bold">Failed</option>
                <option value="Pending" className="text-amber-700 font-bold">Pending</option>
              </select>
            </div>
          </div>

          {assayResult === 'Failed' && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs space-y-1">
              <span className="font-bold block">⚠️ Quality Inspection Warning:</span>
              <span>Marking assay as Failed will prevent automatic payout release and trigger dispute review.</span>
            </div>
          )}

          {/* Assay Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-secondary uppercase">
              Assay Notes <span className="text-muted font-normal lowercase">(optional)</span>
            </label>
            <input
              type="text"
              value={assayNotes}
              onChange={(e) => setAssayNotes(e.target.value)}
              placeholder="e.g., Moisture 11.2%, foreign matter 0.4%, NABL verified."
              className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Verification Remarks */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-secondary uppercase">
              Verification Remarks <span className="text-muted font-normal lowercase">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={verificationRemarks}
              onChange={(e) => setVerificationRemarks(e.target.value)}
              placeholder="e.g., Full weighbridge weigh-in matches dispatch tolerance."
              className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="bg-[#166534] hover:bg-[#14532d] flex items-center gap-2 shadow-card"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-[#4ade80]" />
                  <span>Verify Weight & Quality</span>
                </>
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};

// =========================================================================
// 3. RELEASE PAYOUT CONFIRMATION MODAL (BUTTON 3)
// =========================================================================
interface ReleasePayoutModalProps {
  order: OrderItem;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes?: string) => Promise<void>;
}

export const ReleasePayoutModal: React.FC<ReleasePayoutModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const verifiedQty = order.actualReceivedQuantity || order.quantity;
  const verifiedUnit = order.actualQuantityUnit || order.unit || 'kg';
  const pricePerUnit = order.pricePerUnit;
  const calculatedPayout = Math.round(verifiedQty * pricePerUnit * 100) / 100;
  const finalPayoutAmount = calculatedPayout > 0 ? calculatedPayout : order.totalAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm(notes);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-border">
        
        {/* Header */}
        <div className="bg-[#166534] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-[#4ade80]" />
            <h3 className="font-bold text-lg">Release Smart Escrow Payout</h3>
          </div>
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Dual-Gate Sign-off Passed: Weighment & NABL Quality Assay verified.</span>
          </div>

          <div className="bg-[#F7F9F6] p-4 rounded-xl border border-border space-y-2.5">
            <div className="flex justify-between items-center border-b border-border/60 pb-2">
              <span className="text-xs text-muted font-medium uppercase">Order</span>
              <span className="font-mono font-bold text-primary">{order.orderNumber}</span>
            </div>

            <div className="flex justify-between items-center border-b border-border/60 pb-2">
              <span className="text-xs text-muted font-medium uppercase">Verified Quantity</span>
              <span className="font-bold text-main">{verifiedQty} {verifiedUnit}s</span>
            </div>

            <div className="flex justify-between items-center border-b border-border/60 pb-2">
              <span className="text-xs text-muted font-medium uppercase">Quality</span>
              <span className="font-semibold text-main">{order.qualityGrade || 'Grade A'}</span>
            </div>

            <div className="flex justify-between items-center border-b border-border/60 pb-2">
              <span className="text-xs text-muted font-medium uppercase">Assay</span>
              <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-xs">
                {order.assayResult || 'Passed'}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-border/60 pb-2">
              <span className="text-xs text-muted font-medium uppercase">Escrow Vault</span>
              <span className="font-semibold text-secondary flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-accent" /> Locked (Simulated Escrow)
              </span>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-xs text-muted font-bold uppercase">Final Payout Amount</span>
              <span className="text-xl font-bold font-mono text-[#166534]">
                ₹{finalPayoutAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <p className="text-xs text-secondary leading-relaxed">
            Are you sure you want to release the payout? This action will disburse the smart escrow funds to <strong>{order.farmerName}</strong> and mark the order as <strong>Completed</strong>.
          </p>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-secondary uppercase">
              Settlement Notes <span className="text-muted font-normal lowercase">(optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Final weighment verified and contract settled."
              className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="bg-[#166534] hover:bg-[#14532d] flex items-center gap-2 shadow-card"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Releasing Payout...</span>
                </>
              ) : (
                <>
                  <IndianRupee className="w-4 h-4 text-[#4ade80]" />
                  <span>Release Payout</span>
                </>
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};
