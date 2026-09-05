import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RequirementCard } from '../../components/ui/domainCards';
import { BuyerRequirement } from '../../types';
import { ClipboardList, Filter, Search, Sparkles } from 'lucide-react';
import { EmptyState } from '../../components/ui/feedback';

export const BuyerRequirementsPage: React.FC = () => {
  const { requirementsList, showToast } = useApp();
  const [searchCrop, setSearchCrop] = useState('');
  const [filterOnlyHighMatch, setFilterOnlyHighMatch] = useState(false);

  const filteredRequirements = requirementsList.filter(req => {
    const matchesSearch = req.crop.toLowerCase().includes(searchCrop.toLowerCase()) || 
                          req.deliveryLocation.toLowerCase().includes(searchCrop.toLowerCase()) ||
                          req.companyName.toLowerCase().includes(searchCrop.toLowerCase());
    const matchesScore = filterOnlyHighMatch ? (req.matchingScore && req.matchingScore >= 90) : true;
    return matchesSearch && matchesScore;
  });

  const handleRespond = (req: BuyerRequirement) => {
    showToast(
      'Offer Submitted to Buyer',
      `Your lot availability was sent to ${req.companyName} for review.`,
      'success'
    );
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-main tracking-tight">
            Institutional Buyer Requirements
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            Discover verified procurement demand from FMCG, retail chains, and food processors.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchCrop}
              onChange={(e) => setSearchCrop(e.target.value)}
              placeholder="Search crop, buyer, city..."
              className="pl-9 pr-3.5 py-2 bg-card border border-border rounded-input text-xs sm:text-sm text-main placeholder:text-muted focus:ring-1 focus:ring-primary w-48 sm:w-60"
            />
          </div>

          <button
            onClick={() => setFilterOnlyHighMatch(prev => !prev)}
            className={`px-3 py-2 text-xs font-semibold rounded-button border transition-colors flex items-center gap-1.5 ${
              filterOnlyHighMatch 
                ? 'bg-accent-light text-primary border-[#bbf7d0]' 
                : 'bg-card text-secondary border-border hover:bg-[#EAEFEA]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>90%+ Smart Match Only</span>
          </button>
        </div>
      </div>

      {/* Smart Match explanation banner */}
      <div className="bg-[#F0FDF4] border border-[#bbf7d0] p-4 rounded-card flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-accent shrink-0" />
          <span className="text-main">
            <strong>AI Smart Matching Active:</strong> Requirements are automatically scored against your listed crops, regional transit distance, and historical quality assay reports.
          </span>
        </div>
      </div>

      {/* Requirements List */}
      {filteredRequirements.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No buyer requirements found"
          description="Try broadening your search term or clearing the 90%+ Smart Match filter."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchCrop('');
            setFilterOnlyHighMatch(false);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRequirements.map((req) => (
            <RequirementCard
              key={req.id}
              requirement={req}
              onRespond={handleRespond}
              showSmartMatch={true}
            />
          ))}
        </div>
      )}

    </div>
  );
};
