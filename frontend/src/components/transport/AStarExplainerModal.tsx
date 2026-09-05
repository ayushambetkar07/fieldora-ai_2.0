import React, { useState } from 'react';
import { 
  RouteOptimizationResult, 
  AStarCostWeights 
} from '../../types/transport';
import { 
  X, 
  Calculator, 
  Sparkles, 
  Cpu, 
  Layers, 
  Sliders, 
  CheckCircle2, 
  ChevronRight, 
  HelpCircle 
} from 'lucide-react';
import { Button, Card } from '../ui';

interface AStarExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRoute: RouteOptimizationResult;
  currentWeights: AStarCostWeights;
  onUpdateWeights?: (weights: AStarCostWeights) => void;
}

export const AStarExplainerModal: React.FC<AStarExplainerModalProps> = ({
  isOpen,
  onClose,
  selectedRoute,
  currentWeights,
  onUpdateWeights
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'math' | 'logs' | 'weights'>('math');
  const [weightsState, setWeightsState] = useState<AStarCostWeights>(currentWeights);

  const handleApplyWeights = () => {
    if (onUpdateWeights) {
      onUpdateWeights(weightsState);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-card w-full max-w-2xl rounded-card shadow-2xl border border-border flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-[#F8FAF8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#166534] flex items-center justify-center text-white shadow-2xs">
              <Calculator className="w-4 h-4 text-[#4ade80]" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-main flex items-center gap-2">
                <span>A* Route Optimization Mathematical Model</span>
                <span className="text-[10px] font-mono bg-accent-light text-primary border border-[#bbf7d0] px-2 py-0.5 rounded-full">
                  f(n) = g(n) + h(n)
                </span>
              </h2>
              <p className="text-xs text-secondary">
                Intelligent routing engine powering Fieldora's direct farm-to-buyer logistics
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-button text-secondary hover:text-main hover:bg-[#EAEFEA] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border bg-[#FAFCFA] px-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('math')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'math'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-secondary hover:text-main'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Cost Function Formulation</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-secondary hover:text-main'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>A* Traversal Step Logs ({selectedRoute.aStarLogs?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('weights')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'weights'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-secondary hover:text-main'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Algorithm Weights Tuner</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-main flex-1">
          
          {/* 1. MATH FORMULATION */}
          {activeTab === 'math' && (
            <div className="space-y-4">
              
              {/* Formula Banner */}
              <div className="p-4 bg-[#0d1f12] text-white rounded-input border border-[#1b3e23] space-y-2">
                <span className="text-[11px] uppercase font-bold text-accent-light tracking-wider">
                  Core Evaluation Function
                </span>
                <div className="font-mono text-xl sm:text-2xl font-extrabold text-[#4ade80]">
                  f(n) = g(n) + h(n)
                </div>
                <p className="text-[11px] text-gray-300">
                  Where <strong>g(n)</strong> is the accumulated exact cost from the farm pickup to current node <em>n</em>, and <strong>h(n)</strong> is the admissible Euclidean heuristic cost to the buyer delivery hub.
                </p>
              </div>

              {/* Cost components grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                <div className="p-3 bg-[#F7F9F6] border border-border rounded-input space-y-1">
                  <span className="font-bold text-primary block">1. Exact Edge Cost g(n)</span>
                  <p className="text-secondary leading-relaxed text-[11px]">
                    <code className="text-main font-mono bg-white px-1 py-0.5 rounded border">
                      cost = (dist × w_dist) + (time × traffic × w_time) + (toll × w_toll)
                    </code>
                    <br />
                    Considers real road length, highway speed limits, active traffic congestion multipliers, and toll fees.
                  </p>
                </div>

                <div className="p-3 bg-[#F7F9F6] border border-border rounded-input space-y-1">
                  <span className="font-bold text-primary block">2. Admissible Heuristic h(n)</span>
                  <p className="text-secondary leading-relaxed text-[11px]">
                    <code className="text-main font-mono bg-white px-1 py-0.5 rounded border">
                      h(n) = EuclideanDistance(n, goal) × minCostRate
                    </code>
                    <br />
                    Guarantees that <em>h(n) ≤ true remaining cost</em>, ensuring A* consistently finds the globally optimal route.
                  </p>
                </div>

              </div>

              {/* Selected Route Breakdown */}
              <div className="p-3.5 bg-white border border-border rounded-input space-y-2">
                <span className="font-bold text-main block">
                  Active Path Cost Attribution ({selectedRoute.name}):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-[#F7F9F6] p-2 rounded border border-border">
                    <span className="text-[10px] text-muted block">Distance Cost</span>
                    <span className="font-mono font-bold text-primary text-xs">
                      ₹{selectedRoute.costBreakdown?.distanceCost || 0}
                    </span>
                  </div>
                  <div className="bg-[#F7F9F6] p-2 rounded border border-border">
                    <span className="text-[10px] text-muted block">Time & Speed</span>
                    <span className="font-mono font-bold text-primary text-xs">
                      ₹{selectedRoute.costBreakdown?.travelTimeCost || 0}
                    </span>
                  </div>
                  <div className="bg-[#F7F9F6] p-2 rounded border border-border">
                    <span className="text-[10px] text-muted block">Traffic Multiplier</span>
                    <span className="font-mono font-bold text-primary text-xs">
                      ₹{selectedRoute.costBreakdown?.trafficPenaltyCost || 0}
                    </span>
                  </div>
                  <div className="bg-[#F7F9F6] p-2 rounded border border-border">
                    <span className="text-[10px] text-muted block">Total Tolls</span>
                    <span className="font-mono font-bold text-primary text-xs">
                      ₹{selectedRoute.totalTollCost}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 2. TRAVERSAL STEP LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <p className="text-xs text-secondary">
                Sequence of graph nodes evaluated during the A* search from priority queue:
              </p>
              
              <div className="border border-border rounded-input overflow-hidden divide-y divide-border">
                <div className="grid grid-cols-5 bg-[#F7F9F6] p-2 font-bold text-[10px] uppercase text-secondary">
                  <span>Node Evaluated</span>
                  <span>Origin / Parent</span>
                  <span className="text-right">g(n) Cost</span>
                  <span className="text-right">h(n) Est</span>
                  <span className="text-right text-primary">f(n) Total</span>
                </div>

                {selectedRoute.aStarLogs?.map((log, index) => (
                  <div key={index} className="grid grid-cols-5 p-2 items-center text-xs hover:bg-[#F9FAF9]">
                    <span className="font-bold text-main truncate">{log.nodeName}</span>
                    <span className="text-muted truncate">{log.parentName || 'Origin'}</span>
                    <span className="font-mono text-right text-secondary">₹{log.gScore}</span>
                    <span className="font-mono text-right text-secondary">₹{log.hScore}</span>
                    <span className="font-mono font-bold text-right text-primary">₹{log.fScore}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. ALGORITHM WEIGHTS TUNER */}
          {activeTab === 'weights' && (
            <div className="space-y-4">
              <p className="text-xs text-secondary">
                Adjust cost weights to simulate different priorities (e.g. prioritize speed over tolls or vice-versa):
              </p>

              <div className="space-y-3 bg-[#F7F9F6] p-4 rounded-input border border-border">
                
                {/* Distance Weight */}
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>Distance Weight Multiplier</span>
                    <span className="font-mono text-primary">{weightsState.distanceWeight}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={weightsState.distanceWeight}
                    onChange={(e) => setWeightsState({ ...weightsState, distanceWeight: parseFloat(e.target.value) })}
                    className="w-full accent-[#166534]"
                  />
                </div>

                {/* Time Weight */}
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>Travel Time Urgency</span>
                    <span className="font-mono text-primary">{weightsState.timeWeight}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={weightsState.timeWeight}
                    onChange={(e) => setWeightsState({ ...weightsState, timeWeight: parseFloat(e.target.value) })}
                    className="w-full accent-[#166534]"
                  />
                </div>

                {/* Toll Penalty Weight */}
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>Toll Avoidance Weight</span>
                    <span className="font-mono text-primary">{weightsState.tollWeight}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="2.0"
                    step="0.1"
                    value={weightsState.tollWeight}
                    onChange={(e) => setWeightsState({ ...weightsState, tollWeight: parseFloat(e.target.value) })}
                    className="w-full accent-[#166534]"
                  />
                </div>

              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setWeightsState(currentWeights)}
                >
                  Reset Defaults
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleApplyWeights}
                >
                  Re-calculate A* Route
                </Button>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-[#F8FAF8] flex items-center justify-between text-xs">
          <span className="text-secondary flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Fieldora Direct A* Optimizer v2.4
          </span>
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>

      </div>
    </div>
  );
};
