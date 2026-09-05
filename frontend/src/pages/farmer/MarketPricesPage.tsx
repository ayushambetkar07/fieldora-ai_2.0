import React, { useState } from 'react';
import { MOCK_MARKET_PRICES } from '../../data/mockData';
import { MarketPricePoint } from '../../types';
import { 
  TrendingUp, 
  TrendingDown, 
  MapPin, 
  Sparkles, 
  IndianRupee, 
  Scale, 
  Calendar,
  Info,
  ArrowRight
} from 'lucide-react';
import { PriceChart } from '../../components/ui/PriceChart';
import { Card, Select, Badge, cn } from '../../components/ui';

export const MarketPricesPage: React.FC = () => {
  const [selectedCrop, setSelectedCrop] = useState<string>('Tomato');
  const activeData = MOCK_MARKET_PRICES.find(p => p.crop.toLowerCase() === selectedCrop.toLowerCase()) || MOCK_MARKET_PRICES[0];

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      
      {/* Header & Commodity Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-main tracking-tight">
            Market Reference Prices
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            Real-time APMC Mandi benchmark data and plain-language pricing intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-secondary">Select Commodity:</span>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="px-3.5 py-2 bg-card border border-border rounded-input text-xs sm:text-sm font-semibold text-main focus:ring-1 focus:ring-primary"
          >
            <option value="Tomato">Tomato (Hybrid Table)</option>
            <option value="Onion">Onion (Red Garwa)</option>
            <option value="Potato">Potato (Kufri Jyoti)</option>
            <option value="Wheat">Wheat (Sharbati C-306)</option>
          </select>
        </div>
      </div>

      {/* 1. Top Summary Cards (Current, Average, Highest, Lowest) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-5 space-y-1.5 bg-gradient-to-br from-white to-[#F0FDF4] border-[#bbf7d0]">
          <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">Current Mandi Price</span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-primary flex items-center">
            <IndianRupee className="w-5 h-5 mr-0.5" />
            {activeData.currentPrice.toLocaleString('en-IN')}<span className="text-xs font-normal text-secondary ml-1">/q</span>
          </div>
          <div className="flex items-center text-xs font-semibold">
            {activeData.changePercent > 0 ? (
              <span className="text-accent flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +{activeData.changePercent}% vs last week
              </span>
            ) : (
              <span className="text-error flex items-center">
                <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> {activeData.changePercent}% vs last week
              </span>
            )}
          </div>
        </Card>

        <Card className="p-4 sm:p-5 space-y-1.5">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">30-Day Average</span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-main">
            ₹{activeData.averagePrice.toLocaleString('en-IN')}<span className="text-xs font-normal text-secondary ml-1">/q</span>
          </div>
          <p className="text-xs text-secondary">Terminal market weighted average</p>
        </Card>

        <Card className="p-4 sm:p-5 space-y-1.5">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">30-Day Highest</span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-accent">
            ₹{activeData.highestPrice.toLocaleString('en-IN')}<span className="text-xs font-normal text-secondary ml-1">/q</span>
          </div>
          <p className="text-xs text-secondary">Peak modal auction rate</p>
        </Card>

        <Card className="p-4 sm:p-5 space-y-1.5">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">30-Day Lowest</span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-secondary">
            ₹{activeData.lowestPrice.toLocaleString('en-IN')}<span className="text-xs font-normal text-secondary ml-1">/q</span>
          </div>
          <p className="text-xs text-secondary">Base floor price recorded</p>
        </Card>
      </div>

      {/* 2. Price Trend Chart & Fieldora Plain-Language Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Price Trend Chart (8 cols) */}
        <Card className="lg:col-span-8 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-main">{activeData.crop} 30-Day Mandi Price Trend</h2>
              <p className="text-xs text-secondary">{activeData.mandi} • Modal Arrival Price (₹/Quintal)</p>
            </div>
            <span className="text-xs text-secondary bg-[#F7F9F6] px-2.5 py-1 rounded-full border border-border">
              Historical Daily Data
            </span>
          </div>

          <PriceChart priceData={activeData} />
        </Card>

        {/* Fieldora Plain-Language Insight (4 cols) */}
        <Card className="lg:col-span-4 p-5 sm:p-6 space-y-4 bg-gradient-to-b from-white to-[#FAFCFA] flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <div className="w-7 h-7 rounded-lg bg-primary text-accent flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-main">✦ Fieldora Price Insight</h3>
            </div>

            <p className="text-xs text-main leading-relaxed bg-[#F7F9F6] p-3 rounded-input border border-border font-medium">
              {activeData.insightSummary}
            </p>

            <div className="space-y-2 text-xs">
              <strong className="text-main block">Actionable Recommendation:</strong>
              <p className="text-secondary leading-relaxed text-[11px]">
                {activeData.recommendation}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-border">
            <div className="bg-[#EAEFEA] p-2.5 rounded-input text-[11px] text-secondary flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span>Reference rates compiled directly from Agmarknet & APMC daily terminal arrivals.</span>
            </div>
          </div>
        </Card>

      </div>

      {/* 3. Nearby Regional Mandis Comparison Table */}
      <Card className="p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-main">Nearby Mandis Comparison</h2>
          <p className="text-xs text-secondary">Compare spot rates across regional agricultural trading hubs</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F7F9F6] text-secondary uppercase font-semibold border-b border-border">
              <tr>
                <th className="py-3 px-4">Mandi Hub</th>
                <th className="py-3 px-4">Distance from Farm</th>
                <th className="py-3 px-4 font-mono">Spot Rate (₹/q)</th>
                <th className="py-3 px-4">Weekly Movement</th>
                <th className="py-3 px-4">Trend Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium text-main">
              {activeData.nearbyMarkets.map((market, idx) => (
                <tr key={idx} className="hover:bg-[#F7F9F6] transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-main flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-muted" />
                    <span>{market.mandi}</span>
                  </td>
                  <td className="py-3.5 px-4 text-secondary">
                    {market.distanceKm === 0 ? 'Primary Hub (0 km)' : `${market.distanceKm} km`}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-primary text-sm">
                    ₹{market.price.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={cn("inline-flex items-center", market.changePercent > 0 ? "text-accent" : "text-error")}>
                      {market.changePercent > 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                      {market.changePercent > 0 ? `+${market.changePercent}%` : `${market.changePercent}%`}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={market.trend === 'up' ? 'success' : market.trend === 'down' ? 'error' : 'default'}>
                      {market.trend.toUpperCase()}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
};
