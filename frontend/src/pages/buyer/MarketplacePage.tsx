import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { parseNaturalLanguageQuery } from '../../services/aiService';
import { ProduceListing, ParsedSearchQuery } from '../../types';
import { ProduceCard } from '../../components/ui/domainCards';
import { 
  Search, 
  Sparkles, 
  X, 
  SlidersHorizontal, 
  Filter, 
  Wheat, 
  Store, 
  Send, 
  BadgeCheck, 
  CheckCircle2, 
  IndianRupee,
  ChevronDown
} from 'lucide-react';
import { Button, Input, Select, Card } from '../../components/ui';
import { EmptyState } from '../../components/ui/feedback';
import { getCropOptions } from '../../data/cropMaster';

export const MarketplacePage: React.FC = () => {
  const { produceList, sendPurchaseRequest } = useApp();
  
  // Natural Language Search State
  const [nlQuery, setNlQuery] = useState('');
  const [appliedParsed, setAppliedParsed] = useState<ParsedSearchQuery | null>(null);

  // Standard Filters State (matching reference layout)
  const [selectedCrop, setSelectedCrop] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<string>('12000');
  const [onlyVerified, setOnlyVerified] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<string>('recommended');

  // Contact Modal State
  const [contactingProduce, setContactingProduce] = useState<ProduceListing | null>(null);
  const [reqQty, setReqQty] = useState('');
  const [reqOfferPrice, setReqOfferPrice] = useState('');
  const [reqLocation, setReqLocation] = useState('Mumbai Central Distribution Center');
  const [reqDate, setReqDate] = useState('2026-09-08');
  const [reqMessage, setReqMessage] = useState('');

  // Handle Natural Language Search Submission
  const handleNlSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nlQuery.trim()) {
      setAppliedParsed(null);
      return;
    }

    const parsed = parseNaturalLanguageQuery(nlQuery);
    setAppliedParsed(parsed);
  };

  const handleExamplePrompt = (example: string) => {
    setNlQuery(example);
    const parsed = parseNaturalLanguageQuery(example);
    setAppliedParsed(parsed);
  };

  const clearNlFilter = (key: keyof ParsedSearchQuery) => {
    if (!appliedParsed) return;
    const updated = { ...appliedParsed };
    delete updated[key];
    setAppliedParsed(updated);
  };

  const clearAllFilters = () => {
    setNlQuery('');
    setAppliedParsed(null);
    setSelectedCrop('All');
    setSelectedCategory('All');
    setSelectedLocation('All');
    setMaxPrice('12000');
    setOnlyVerified(false);
  };

  // Filter produce
  const filteredProduce = useMemo(() => {
    return produceList.filter(p => {
      // 1. Natural language extracted filters
      if (appliedParsed?.crop && !p.crop.toLowerCase().includes(appliedParsed.crop.toLowerCase())) {
        return false;
      }
      if (appliedParsed?.quality && !p.quality.toLowerCase().includes(appliedParsed.quality.toLowerCase())) {
        return false;
      }
      if (appliedParsed?.location && !p.location.toLowerCase().includes(appliedParsed.location.toLowerCase())) {
        return false;
      }
      if (appliedParsed?.maxPrice && p.expectedPrice > appliedParsed.maxPrice) {
        return false;
      }

      // 2. Standard Filters from Reference Panel
      if (selectedCrop !== 'All' && p.crop.toLowerCase() !== selectedCrop.toLowerCase()) return false;
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
      if (selectedLocation !== 'All' && !p.location.toLowerCase().includes(selectedLocation.toLowerCase())) return false;
      if (maxPrice && p.expectedPrice > parseFloat(maxPrice)) return false;
      if (onlyVerified && !p.isFarmerVerified) return false;

      return true;
    });
  }, [produceList, appliedParsed, selectedCrop, selectedCategory, selectedLocation, maxPrice, onlyVerified]);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      
      {/* Header (Exact matching to Reference Image) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-secondary">Marketplace</span>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-main tracking-tight mt-0.5">
            Find Fresh Produce Directly From Farmers
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-secondary">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 bg-white border border-[#EAEFEA] rounded-input text-xs font-semibold text-main focus:ring-1 focus:ring-primary shadow-xs"
          >
            <option value="recommended">Recommended</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="recent">Harvest Date</option>
          </select>
        </div>
      </div>

      {/* Top Search Bar with Natural Language Support */}
      <div className="ref-card p-3 sm:p-4 bg-white space-y-3">
        <form onSubmit={handleNlSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              placeholder="Search produce or type requirement (e.g. 500 kg Grade A tomatoes near Mumbai)..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8F3] border border-[#EAEFEA] rounded-input text-xs sm:text-sm text-main placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 btn-deep-green text-xs font-bold rounded-input shadow-xs shrink-0"
          >
            Search
          </button>
        </form>

        {/* AI Extracted Filter Chips */}
        {appliedParsed && Object.keys(appliedParsed).length > 1 && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#EAEFEA] text-xs">
            <span className="font-bold text-primary flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#22C55E]" /> AI Filters:
            </span>
            {appliedParsed.crop && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#E8F3EB] text-[#166534] text-xs font-semibold rounded-full border border-[#bbf7d0]">
                Crop: {appliedParsed.crop}
                <X className="w-3 h-3 cursor-pointer ml-1" onClick={() => clearNlFilter('crop')} />
              </span>
            )}
            {appliedParsed.quality && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#E8F3EB] text-[#166534] text-xs font-semibold rounded-full border border-[#bbf7d0]">
                Quality: {appliedParsed.quality}
                <X className="w-3 h-3 cursor-pointer ml-1" onClick={() => clearNlFilter('quality')} />
              </span>
            )}
            {appliedParsed.maxPrice && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#E8F3EB] text-[#166534] text-xs font-semibold rounded-full border border-[#bbf7d0]">
                Max: ≤ ₹{appliedParsed.maxPrice}/q
                <X className="w-3 h-3 cursor-pointer ml-1" onClick={() => clearNlFilter('maxPrice')} />
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Layout: Left Filter Sidebar + Right Produce Grid (matching reference image) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Filter Sidebar (3 Cols) */}
        <div className="lg:col-span-3 ref-card p-5 bg-white space-y-5">
          <div className="flex items-center justify-between border-b border-[#EAEFEA] pb-3">
            <span className="font-heading font-extrabold text-sm text-main flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-primary" /> Filters
            </span>
            <button
              onClick={clearAllFilters}
              className="text-[11px] text-primary font-bold hover:underline"
            >
              Reset
            </button>
          </div>

          {/* Commodity / Crop Filter */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-main">Commodity / Crop</label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full px-3 py-2 bg-[#F7F8F3] border border-[#EAEFEA] rounded-input text-xs font-semibold text-main"
            >
              <option value="All">All 15 Crops</option>
              {getCropOptions().map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-main">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-[#F7F8F3] border border-[#EAEFEA] rounded-input text-xs font-semibold text-main"
            >
              <option value="All">All Categories</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Grains">Grains & Cereals</option>
              <option value="Pulses">Pulses</option>
              <option value="Oilseeds">Oilseeds</option>
            </select>
          </div>

          {/* Location Filter */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-main">Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 bg-[#F7F8F3] border border-[#EAEFEA] rounded-input text-xs font-semibold text-main"
            >
              <option value="All">All Locations</option>
              <option value="Nashik">Nashik, Maharashtra</option>
              <option value="Indore">Indore, Madhya Pradesh</option>
              <option value="Karnal">Karnal, Haryana</option>
              <option value="Pune">Pune, Maharashtra</option>
            </select>
          </div>

          {/* Price Range Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-main">
              <span>Max Price</span>
              <span className="font-mono text-primary">₹{parseInt(maxPrice).toLocaleString('en-IN')}/q</span>
            </div>
            <input
              type="range"
              min="1000"
              max="6000"
              step="100"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full accent-primary"
            />
          </div>

          {/* Farmer Verification Checkbox (matching reference) */}
          <div className="space-y-2 pt-2 border-t border-[#EAEFEA]">
            <label className="block text-xs font-bold text-main">Farmer Verification</label>
            
            <label className="flex items-center gap-2 text-xs text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={onlyVerified}
                onChange={(e) => setOnlyVerified(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
              />
              <span className="font-medium text-main">Verified Farmer</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E] ml-auto" />
            </label>
          </div>

        </div>

        {/* Right Produce Grid (9 Cols) */}
        <div className="lg:col-span-9 space-y-4">
          <div className="flex items-center justify-between text-xs text-secondary">
            <span>Showing <strong>{filteredProduce.length}</strong> harvest produce lots</span>
          </div>

          {filteredProduce.length === 0 ? (
            <EmptyState
              icon={Store}
              title="No produce found"
              description="No harvest lots match your exact filters. Try loosening your price or location filters."
              actionLabel="Reset All Filters"
              onAction={clearAllFilters}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProduce.map((prod) => (
                <ProduceCard
                  key={prod.id}
                  produce={prod}
                />
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
