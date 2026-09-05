import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ProduceStatus } from '../../types';
import { 
  Plus, 
  Wheat, 
  Trash2, 
  Eye, 
  MapPin, 
  CalendarDays, 
  IndianRupee, 
  Scale, 
  Truck,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { Button, Card, StatusBadge, cn } from '../../components/ui';
import { EmptyState } from '../../components/ui/feedback';

export const MyProducePage: React.FC = () => {
  const { currentFarmer, produceList, deleteProduce } = useApp();
  const [selectedTab, setSelectedTab] = useState<ProduceStatus | 'All'>('All');

  const myProduce = produceList.filter(p => p.farmerId === currentFarmer.id);
  const filteredProduce = selectedTab === 'All' 
    ? myProduce 
    : myProduce.filter(p => p.status === selectedTab);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-main tracking-tight">My Produce Lots</h1>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            Manage your harvest listings, active offers, and marketplace visibility.
          </p>
        </div>

        <Link to="/farmer/produce/new">
          <Button variant="primary" size="md" className="flex items-center gap-1.5 shadow-card">
            <Plus className="w-4 h-4" />
            <span>+ List Produce</span>
          </Button>
        </Link>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
        {(['All', 'Active', 'Sold', 'Pending'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors shrink-0",
              selectedTab === tab 
                ? "bg-primary text-white shadow-card" 
                : "bg-card text-secondary hover:text-main hover:bg-[#EAEFEA] border border-border"
            )}
          >
            {tab} ({tab === 'All' ? myProduce.length : myProduce.filter(p => p.status === tab).length})
          </button>
        ))}
      </div>

      {/* Produce Grid / Table */}
      {filteredProduce.length === 0 ? (
        <EmptyState
          icon={Wheat}
          title="No produce listings found"
          description={selectedTab === 'All' 
            ? "You haven't listed any harvest lots yet. Publish your first crop to connect with verified buyers."
            : `No produce currently marked as ${selectedTab}.`
          }
          actionLabel="+ List Your First Crop"
          onAction={() => window.location.href = '#/farmer/produce/new'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProduce.map((prod) => (
            <div 
              key={prod.id} 
              className="bg-card border border-border rounded-card overflow-hidden shadow-card hover:shadow-hover transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 w-full bg-[#EAEFEA]">
                  <img 
                    src={prod.imageUrl} 
                    alt={prod.crop} 
                    className="w-full h-full object-cover" 
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="px-2.5 py-1 bg-white/95 backdrop-blur-xs text-primary font-bold text-xs rounded-full shadow-xs">
                      {prod.crop}
                    </span>
                    <StatusBadge status={prod.status} />
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="font-bold text-base text-main">{prod.variety}</h3>
                    <p className="text-xs text-secondary mt-0.5">{prod.quality} • {prod.category}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-secondary pt-2 border-t border-border">
                    <div className="flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-muted" />
                      <span>{prod.quantity} {prod.unit}s</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-muted" />
                      <span className="truncate">{prod.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5 text-muted" />
                      <span>Harvest: {prod.harvestDate}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-muted" />
                      <span className="truncate">{prod.deliveryOption}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 pt-3 bg-[#FAFCFA] border-t border-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted uppercase font-semibold block">Asking Price</span>
                  <div className="text-lg font-bold text-primary font-mono">
                    ₹{prod.expectedPrice.toLocaleString('en-IN')}/q
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => deleteProduce(prod.id)}
                    className="p-2 border border-border rounded-button text-secondary hover:text-error hover:bg-error-light transition-colors"
                    title="Delete Listing"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Link
                    to={`/buyer/produce/${prod.id}`}
                    className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-button shadow-card flex items-center gap-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Live
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
