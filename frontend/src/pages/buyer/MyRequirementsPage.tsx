import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PlusCircle, ClipboardList, MapPin, Calendar, IndianRupee, Scale } from 'lucide-react';
import { Button, Card, StatusBadge } from '../../components/ui';
import { EmptyState } from '../../components/ui/feedback';

export const MyRequirementsPage: React.FC = () => {
  const { currentBuyer, requirementsList } = useApp();
  const myReqs = requirementsList.filter(r => r.buyerId === currentBuyer.id);

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-main tracking-tight">
            My Published Requirements
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            Active bulk commodity tenders broadcasted across 12,400+ verified FPO federations.
          </p>
        </div>

        <Link to="/buyer/requirements/new">
          <Button variant="primary" size="md" className="flex items-center gap-1.5 shadow-card">
            <PlusCircle className="w-4 h-4" />
            <span>+ Post New Requirement</span>
          </Button>
        </Link>
      </div>

      {myReqs.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No requirements posted yet"
          description="Broadcast your bulk commodity targets with desired pricing and delivery dates to get competitive farmer bids."
          actionLabel="+ Post Your First Requirement"
          onAction={() => window.location.href = '#/buyer/requirements/new'}
        />
      ) : (
        <div className="space-y-4">
          {myReqs.map((req) => (
            <Card key={req.id} className="p-6 space-y-4 hover:border-primary/40 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-main">{req.crop} ({req.variety})</h3>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="text-xs text-secondary mt-0.5">
                    Posted on {req.createdDate} • Required by {req.requiredByDate}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-muted uppercase font-semibold block">Target Price</span>
                  <span className="text-xl font-bold font-mono text-primary">
                    ₹{req.targetPrice.toLocaleString('en-IN')}/q
                  </span>
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#F7F9F6] p-3.5 rounded-input border border-border">
                <div>
                  <span className="text-muted block text-[11px]">Volume Needed</span>
                  <span className="font-bold text-main">{req.quantity} {req.unit}s</span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Quality Grade</span>
                  <span className="font-bold text-main">{req.qualityRequirements}</span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Delivery Depot</span>
                  <span className="font-semibold text-main truncate block">{req.deliveryLocation}</span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Payment Terms</span>
                  <span className="font-semibold text-accent truncate block">{req.paymentTerms}</span>
                </div>
              </div>

            </Card>
          ))}
        </div>
      )}

    </div>
  );
};
