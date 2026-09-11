import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { extractRequirementFromPrompt } from '../../services/aiService';
import { QualityGrade } from '../../types';
import { Sparkles, ArrowLeft, Send, CheckCircle2, ClipboardList, Wand2 } from 'lucide-react';
import { Button, Input, Select, Card } from '../../components/ui';
import { getCropOptions, getCropByName } from '../../data/cropMaster';

export const CreateRequirementPage: React.FC = () => {
  const { addRequirement } = useApp();
  const navigate = useNavigate();

  // AI Prompt State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiExtracted, setIsAiExtracted] = useState(false);

  // Form State
  const [crop, setCrop] = useState('Potato');
  const [variety, setVariety] = useState('Kufri Jyoti / Chipsona Grade');
  const [quantity, setQuantity] = useState('100');
  const [unit, setUnit] = useState<'quintal' | 'kg' | 'ton'>('quintal');
  const [targetPrice, setTargetPrice] = useState('2200');
  const [qualityRequirements, setQualityRequirements] = useState<QualityGrade>('Grade A');
  const [deliveryLocation, setDeliveryLocation] = useState('Mumbai Processing Depot, Bhiwandi');
  const [requiredByDate, setRequiredByDate] = useState('2026-09-20');
  const [paymentTerms, setPaymentTerms] = useState('100% Escrow deposit upon contract confirmation');

  const handleAiExtract = () => {
    if (!aiPrompt.trim()) return;

    const extracted = extractRequirementFromPrompt(aiPrompt);
    setCrop(extracted.crop);
    setVariety(extracted.variety);
    setQuantity(extracted.quantity.toString());
    setTargetPrice(extracted.targetPrice.toString());
    setQualityRequirements(extracted.qualityRequirements);
    setDeliveryLocation(extracted.deliveryLocation);
    setRequiredByDate(extracted.requiredByDate);
    setPaymentTerms(extracted.paymentTerms);
    setIsAiExtracted(true);
  };

  const handleExamplePrompt = () => {
    const example = "I need 1 ton Grade A potatoes in Mumbai by 20 September. My target price is ₹2,200/q.";
    setAiPrompt(example);
    const extracted = extractRequirementFromPrompt(example);
    setCrop(extracted.crop);
    setVariety(extracted.variety);
    setQuantity(extracted.quantity.toString());
    setTargetPrice(extracted.targetPrice.toString());
    setQualityRequirements(extracted.qualityRequirements);
    setDeliveryLocation(extracted.deliveryLocation);
    setRequiredByDate(extracted.requiredByDate);
    setPaymentTerms(extracted.paymentTerms);
    setIsAiExtracted(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    addRequirement({
      crop,
      variety,
      quantity: parseFloat(quantity) || 100,
      unit,
      targetPrice: parseFloat(targetPrice) || 2200,
      qualityRequirements,
      deliveryLocation,
      requiredByDate,
      paymentTerms,
    });

    navigate('/buyer/requirements');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      
      {/* Back button & Header */}
      <div className="space-y-2">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:text-main"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Requirements
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-main tracking-tight">
          Publish Procurement Requirement
        </h1>
        <p className="text-xs sm:text-sm text-secondary">
          Broadcast your bulk commodity targets to verified regional FPOs with smart matching and guaranteed escrow.
        </p>
      </div>

      {/* 1. AI-ASSISTED REQUIREMENT PROMPT SECTION */}
      <Card className="p-5 sm:p-6 space-y-4 border-2 border-[#bbf7d0] bg-gradient-to-r from-white via-white to-[#F0FDF4]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-accent" /> AI Natural-Language Requirement Creator
          </span>
          <button
            type="button"
            onClick={handleExamplePrompt}
            className="text-[11px] font-bold text-primary hover:underline"
          >
            Load Example Prompt
          </button>
        </div>

        <div className="space-y-2">
          <label className="block text-xs text-secondary">Tell Fieldora what you need in plain text:</label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. I need 1 ton Grade A potatoes in Mumbai by 20 September. Target price ₹2,200/q."
              className="flex-1 px-3.5 py-2.5 bg-white border border-border rounded-input text-xs sm:text-sm text-main placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary shadow-xs"
            />
            <Button
              type="button"
              variant="accent"
              size="md"
              onClick={handleAiExtract}
              className="shrink-0"
            >
              <Wand2 className="w-4 h-4 mr-1.5" />
              <span>Auto-Fill Form</span>
            </Button>
          </div>
        </div>

        {isAiExtracted && (
          <div className="p-3 bg-white border border-[#bbf7d0] rounded-input text-xs space-y-1 animate-fade-in">
            <span className="font-bold text-primary flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Fieldora understood and pre-filled your requirement:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-secondary pt-1 text-[11px]">
              <div>Crop: <strong className="text-main">{crop}</strong></div>
              <div>Qty: <strong className="text-main">{quantity} {unit}s</strong></div>
              <div>Target: <strong className="text-main font-mono">₹{targetPrice}/q</strong></div>
              <div>Location: <strong className="text-main">{deliveryLocation.split(' ')[0]}</strong></div>
            </div>
          </div>
        )}
      </Card>

      {/* 2. REQUIREMENT FORM */}
      <Card className="p-6 sm:p-8 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Select
              label="Commodity / Crop *"
              value={crop}
              onChange={(e) => {
                const selectedCrop = e.target.value;
                setCrop(selectedCrop);
                const matched = getCropByName(selectedCrop);
                if (matched) {
                  setVariety(matched.defaultVariety);
                  setTargetPrice(matched.defaultPrice.toString());
                }
              }}
              options={getCropOptions()}
            />

            <Input
              label="Variety / Processing Spec *"
              type="text"
              value={variety}
              onChange={(e) => setVariety(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Input
              label="Target Quantity *"
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
              label="Target Price (₹ / unit) *"
              type="number"
              min="100"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Select
              label="Quality Standard Requirement *"
              value={qualityRequirements}
              onChange={(e) => setQualityRequirements(e.target.value as any)}
              options={[
                { value: 'Grade A+', label: 'Grade A+ (Premium Export)' },
                { value: 'Grade A', label: 'Grade A (Table / Processing)' },
                { value: 'Grade B', label: 'Grade B' },
                { value: 'Export Quality', label: 'Export Quality' },
              ]}
            />

            <Input
              label="Required By Delivery Date *"
              type="date"
              value={requiredByDate}
              onChange={(e) => setRequiredByDate(e.target.value)}
              required
            />
          </div>

          <Input
            label="Destination Facility / Delivery Location *"
            type="text"
            value={deliveryLocation}
            onChange={(e) => setDeliveryLocation(e.target.value)}
            required
          />

          <Input
            label="Payment & Contract Terms *"
            type="text"
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            required
          />

          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/buyer/requirements')}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="lg" className="shadow-card">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Publish Requirement Broadcast
            </Button>
          </div>

        </form>
      </Card>

    </div>
  );
};
