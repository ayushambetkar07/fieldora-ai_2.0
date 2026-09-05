import React from 'react';
import { MOCK_MARKET_PRICES } from '../../data/mockData';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const TickerTape: React.FC = () => {
  const tickerItems = [
    { commodity: "Sharbati Wheat (Grade A)", mandi: "Indore APMC", price: "₹2,680/Qtl", change: "+3.2%", trend: "up" },
    { commodity: "Basmati 1121 Paddy", mandi: "Karnal Mandi", price: "₹4,150/Qtl", change: "+1.8%", trend: "up" },
    { commodity: "Yellow Soybean (Moist <9%)", mandi: "Ujjain APMC", price: "₹4,720/Qtl", change: "-0.6%", trend: "down" },
    { commodity: "Mustard Seed (Oil 42%)", mandi: "Jaipur APMC", price: "₹5,440/Qtl", change: "+2.4%", trend: "up" },
    { commodity: "Jeera / Cumin (Premium)", mandi: "Unjha Mandi", price: "₹26,800/Qtl", change: "+4.5%", trend: "up" },
    { commodity: "Teja Red Chilli (Export)", mandi: "Guntur APMC", price: "₹18,200/Qtl", change: "-1.1%", trend: "down" },
    { commodity: "Long Staple Cotton (29mm)", mandi: "Rajkot APMC", price: "₹6,150/Qtl", change: "+0.9%", trend: "up" },
    { commodity: "Tur / Arhar Dal (Grade A)", mandi: "Gulbarga APMC", price: "₹9,850/Qtl", change: "+1.5%", trend: "up" },
  ];

  // Repeat for smooth infinite marquee loop
  const displayItems = [...tickerItems, ...tickerItems];

  return (
    <div className="ticker-wrap py-2 text-xs flex items-center z-40 relative">
      <div className="bg-[#04150a] px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-primary-fixed flex items-center gap-1.5 shrink-0 z-10 border-r border-primary/40 shadow-xs">
        <span className="live-dot" />
        <span>Mandi Spot Ticker</span>
      </div>

      <div className="ticker-move flex items-center">
        {displayItems.map((item, idx) => {
          const isUp = item.trend === 'up';
          return (
            <span key={idx} className="inline-flex items-center gap-2 mx-5 text-xs font-medium">
              <span className="text-white/90 font-semibold">{item.commodity}</span>
              <span className="text-white/50 text-[11px]">({item.mandi})</span>
              <span className="text-white font-mono font-bold">{item.price}</span>
              <span className={`flex items-center text-[11px] font-mono font-bold ${isUp ? 'text-accent' : 'text-red-400'}`}>
                {isUp ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                {item.change}
              </span>
              <span className="text-white/20 ml-3">•</span>
            </span>
          );
        })}
      </div>
    </div>
  );
};
