import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { QualityGrade } from '../../types';
import { Wheat, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';
import { Button, Input, Select, Textarea, Card } from '../../components/ui';
import { 
  getCropOptions, 
  getCropByName, 
  getCropDefaultVariety, 
  getCropDefaultPrice, 
  getCropCategory, 
  getCropImage 
} from '../../data/cropMaster';

export const ListProducePage: React.FC = () => {
  const { addProduce, currentFarmer } = useApp();
  const navigate = useNavigate();

  const [crop, setCrop] = useState('Tomato');
  const [variety, setVariety] = useState('Abhinav Hybrid Grade A');
  const [category, setCategory] = useState<'Vegetables' | 'Grains' | 'Pulses' | 'Oilseeds' | 'Spices' | 'Cash Crops'>('Vegetables');
  const [quantity, setQuantity] = useState('50');
  const [unit, setUnit] = useState<'quintal' | 'kg' | 'ton'>('quintal');
  const [expectedPrice, setExpectedPrice] = useState('2800');
  const [location, setLocation] = useState(currentFarmer.location);
  const [quality, setQuality] = useState<QualityGrade>('Grade A');
  const [harvestDate, setHarvestDate] = useState('2026-09-05');
  const [deliveryOption, setDeliveryOption] = useState<'Farm-gate Pickup' | 'Direct Delivery' | 'Mandi Delivery' | 'Flexible'>('Direct Delivery');
  const [description, setDescription] = useState('Hand-sorted, uniform 55-65mm diameter firm red tomatoes suitable for retail and bulk processing.');
  const [imageUrl, setImageUrl] = useState(getCropImage('Tomato'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const resolvedImage = getCropImage(crop, imageUrl);

    addProduce({
      crop,
      variety,
      category,
      quantity: parseFloat(quantity) || 50,
      unit,
      expectedPrice: parseFloat(expectedPrice) || 2800,
      marketReferencePrice: parseFloat(expectedPrice) || 2800,
      location,
      quality,
      harvestDate,
      deliveryOption,
      status: 'Active',
      description,
      imageUrl: resolvedImage,
      moisturePercentage: 91,
    });

    navigate('/farmer/produce');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">

      {/* Back link & Header */}
      <div className="space-y-2">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:text-main"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Produce
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-main tracking-tight">
          List New Harvest Produce
        </h1>
        <p className="text-xs sm:text-sm text-secondary">
          Publish your agricultural lot to start receiving instant purchase requests from verified institutional buyers.
        </p>
      </div>

      <Card className="p-6 sm:p-8 space-y-6">

        {/* Mandi Benchmark Helper banner */}
        <div className="bg-[#F0FDF4] border border-[#bbf7d0] p-4 rounded-input flex items-start gap-3 text-xs">
          <Sparkles className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-main">
            <strong>Mandi Reference Insight:</strong> Active benchmark for {crop} is <strong>₹{parseInt(expectedPrice || '2500').toLocaleString('en-IN')}/q</strong> at APMC. Pricing at or near market parity ensures faster buyer response.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Select
              label="Commodity / Crop *"
              value={crop}
              onChange={(e) => {
                const selectedName = e.target.value;
                setCrop(selectedName);
                const matched = getCropByName(selectedName);
                if (matched) {
                  setVariety(matched.defaultVariety);
                  setCategory(matched.category);
                  setExpectedPrice(matched.defaultPrice.toString());
                  setImageUrl(matched.image);
                }
              }}
              options={getCropOptions()}
            />

            <Input
              label="Variety / Spec *"
              type="text"
              value={variety}
              onChange={(e) => setVariety(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Input
              label="Available Quantity *"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />

            <Select
              label="Unit *"
              value={unit}
              onChange={(e) => setUnit(e.target.value as any)}
              options={[
                { value: 'quintal', label: 'Quintals (100 kg)' },
                { value: 'ton', label: 'Metric Tons (1,000 kg)' },
                { value: 'kg', label: 'Kilograms (kg)' },
              ]}
            />

            <Input
              label="Expected Price (₹ / unit) *"
              type="number"
              min="100"
              value={expectedPrice}
              onChange={(e) => setExpectedPrice(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Select
              label="Quality Grade *"
              value={quality}
              onChange={(e) => setQuality(e.target.value as any)}
              options={[
                { value: 'Grade A+', label: 'Grade A+ (Premium Export)' },
                { value: 'Grade A', label: 'Grade A (Table / Retail)' },
                { value: 'Grade B', label: 'Grade B (Processing)' },
                { value: 'Export Quality', label: 'Export Quality' },
              ]}
            />

            <Input
              label="Harvest / Dispatch Date *"
              type="date"
              value={harvestDate}
              onChange={(e) => setHarvestDate(e.target.value)}
              required
            />

            <Select
              label="Delivery Option *"
              value={deliveryOption}
              onChange={(e) => setDeliveryOption(e.target.value as any)}
              options={[
                { value: 'Direct Delivery', label: 'Direct Delivery to Buyer' },
                { value: 'Farm-gate Pickup', label: 'Farm-gate Pickup' },
                { value: 'Mandi Delivery', label: 'Mandi Delivery' },
                { value: 'Flexible', label: 'Flexible Terms' },
              ]}
            />
          </div>

          <Input
            label="Storage Location / District *"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />

          <Textarea
            label="Lot Description & Specifications"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            helperText="Include sorting standards, moisture details, packaging type, and certification."
          />

          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/farmer/produce')}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="lg" className="shadow-card">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Publish Listing Live
            </Button>
          </div>

        </form>

      </Card>
    </div>
  );
};
