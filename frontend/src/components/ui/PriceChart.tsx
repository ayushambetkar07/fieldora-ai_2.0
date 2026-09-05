import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { MarketPricePoint } from '../../types';

interface PriceChartProps {
  priceData: MarketPricePoint;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-card border border-border shadow-card text-xs space-y-1">
        <p className="font-semibold text-main">{label} 2026</p>
        <p className="text-primary font-bold font-mono">
          Rate: ₹{payload[0].value.toLocaleString('en-IN')}/q
        </p>
        {payload[0].payload.volumeMT && (
          <p className="text-secondary text-[11px]">
            Arrival Volume: {payload[0].payload.volumeMT} MT
          </p>
        )}
      </div>
    );
  }
  return null;
};

export const PriceChart: React.FC<PriceChartProps> = ({ priceData }) => {
  const data = priceData.historical30Days;
  const minPrice = Math.min(...data.map(d => d.price)) - 100;
  const maxPrice = Math.max(...data.map(d => d.price)) + 100;

  return (
    <div className="w-full h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#166534" stopOpacity={0.18}/>
              <stop offset="95%" stopColor="#166534" stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5EAE5" vertical={false} />
          <XAxis 
            dataKey="date" 
            tickLine={false} 
            stroke="#94A09A" 
            fontSize={11} 
            tickMargin={8}
          />
          <YAxis 
            domain={[minPrice, maxPrice]} 
            tickLine={false} 
            stroke="#94A09A" 
            fontSize={11}
            tickFormatter={(val) => `₹${val}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke="#166534" 
            strokeWidth={2.5} 
            fillOpacity={1} 
            fill="url(#priceGradient)" 
            activeDot={{ r: 5, fill: "#166534", stroke: "#FFFFFF", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
