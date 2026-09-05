import React, { useState, useEffect } from 'react';
import { 
  RoadNode, 
  RouteOptimizationResult, 
  TrafficLevel 
} from '../../types/transport';
import { 
  ROAD_NODES, 
  ROAD_EDGES 
} from '../../services/aStarRouting';
import { 
  MapPin, 
  Navigation, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Truck, 
  Layers, 
  Clock, 
  Zap, 
  IndianRupee 
} from 'lucide-react';
import { cn } from '../ui';

interface RouteVisualizerMapProps {
  selectedRoute: RouteOptimizationResult;
  allRoutes?: RouteOptimizationResult[];
  onSelectRoute?: (route: RouteOptimizationResult) => void;
  startNodeId: string;
  goalNodeId: string;
  isSimulatingLive?: boolean;
  simulationProgress?: number; // 0 to 100
  className?: string;
}

export const RouteVisualizerMap: React.FC<RouteVisualizerMapProps> = ({
  selectedRoute,
  allRoutes = [],
  onSelectRoute,
  startNodeId,
  goalNodeId,
  isSimulatingLive = false,
  simulationProgress = 0,
  className
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeHoverNode, setActiveHoverNode] = useState<RoadNode | null>(null);
  const [showTrafficLayer, setShowTrafficLayer] = useState(true);

  const startNode = ROAD_NODES.find(n => n.id === startNodeId) || ROAD_NODES[0];
  const goalNode = ROAD_NODES.find(n => n.id === goalNodeId) || ROAD_NODES[8];

  // Calculate animated truck position along the selected route
  const getTruckPosition = () => {
    if (!selectedRoute.pathNodes || selectedRoute.pathNodes.length < 2) {
      return { x: startNode.coordinates.x, y: startNode.coordinates.y, angle: 0 };
    }

    const nodes = selectedRoute.pathNodes;
    const totalSegments = nodes.length - 1;
    const progressNormalized = Math.min(100, Math.max(0, simulationProgress)) / 100;
    
    const currentSegmentFloat = progressNormalized * totalSegments;
    const segmentIndex = Math.min(Math.floor(currentSegmentFloat), totalSegments - 1);
    const segmentProgress = currentSegmentFloat - segmentIndex;

    const n1 = nodes[segmentIndex].coordinates;
    const n2 = nodes[segmentIndex + 1].coordinates;

    const x = n1.x + (n2.x - n1.x) * segmentProgress;
    const y = n1.y + (n2.y - n1.y) * segmentProgress;
    const angle = Math.atan2(n2.y - n1.y, n2.x - n1.x) * (180 / Math.PI);

    return { x, y, angle };
  };

  const truckPos = getTruckPosition();

  // Color mapping for traffic
  const getTrafficStrokeColor = (level: TrafficLevel) => {
    if (!showTrafficLayer) return '#94a3b8';
    switch (level) {
      case 'Heavy': return '#ef4444';
      case 'Moderate': return '#f59e0b';
      case 'Low': return '#22c55e';
      default: return '#10b981';
    }
  };

  // Node position helper
  const getNode = (id: string) => ROAD_NODES.find(n => n.id === id);

  return (
    <div className={cn("relative bg-[#0d1f12] text-white rounded-card overflow-hidden border border-[#1b3e23] shadow-card", className)}>
      
      {/* Top Map HUD Controls */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Route Selector Badges */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-[#07130a]/85 backdrop-blur-md px-2.5 py-1.5 rounded-input border border-[#1b3e23] shadow-md">
          <Navigation className="w-3.5 h-3.5 text-primary-light" />
          <span className="text-[11px] font-bold text-gray-200">Routes:</span>
          {allRoutes.map((route, idx) => {
            const isSelected = selectedRoute.id === route.id;
            return (
              <button
                key={route.id}
                onClick={() => onSelectRoute && onSelectRoute(route)}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold transition-all flex items-center gap-1",
                  isSelected
                    ? "bg-[#166534] text-white shadow-xs border border-[#22c55e]"
                    : "bg-[#112417] text-gray-400 hover:text-white border border-transparent hover:border-[#1b3e23]"
                )}
              >
                <span>{route.isRecommended ? '🟢 Optimal Direct' : `Alt ${idx}`}</span>
                <span className="text-[9px] opacity-80">({route.totalDistanceKm}km)</span>
              </button>
            );
          })}
        </div>

        {/* Map Control Buttons */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-[#07130a]/85 backdrop-blur-md p-1 rounded-input border border-[#1b3e23] shadow-md">
          <button
            onClick={() => setShowTrafficLayer(!showTrafficLayer)}
            title="Toggle Traffic Heatmap"
            className={cn(
              "p-1.5 rounded text-xs transition-colors flex items-center gap-1",
              showTrafficLayer ? "bg-[#166534] text-white" : "text-gray-400 hover:text-white hover:bg-[#152e1d]"
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="text-[10px] hidden sm:inline font-semibold">Traffic</span>
          </button>
          
          <div className="h-3.5 w-px bg-[#1b3e23] mx-0.5" />

          <button
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.15, 1.4))}
            title="Zoom In"
            className="p-1.5 rounded text-gray-300 hover:text-white hover:bg-[#152e1d]"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.15, 0.85))}
            title="Zoom Out"
            className="p-1.5 rounded text-gray-300 hover:text-white hover:bg-[#152e1d]"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            title="Reset View"
            className="p-1.5 rounded text-gray-300 hover:text-white hover:bg-[#152e1d]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="w-full h-[360px] sm:h-[420px] overflow-hidden flex items-center justify-center p-2 cursor-grab active:cursor-grabbing relative bg-radial from-[#102917] via-[#09170e] to-[#050d08]">
        
        {/* Subtle Map Grid Pattern */}
        <svg 
          viewBox="0 0 540 540" 
          className="w-full h-full max-h-full transition-transform duration-300 ease-out select-none"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#163820" strokeWidth="0.5" opacity="0.6" />
            </pattern>

            {/* Glowing Gradient for Selected Route */}
            <linearGradient id="routeGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#4ade80" stopOpacity="1" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.9" />
            </linearGradient>

            {/* Pulse Filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid Background */}
          <rect width="540" height="540" fill="url(#grid)" />

          {/* Western Ghats / Geographical Terrain Silhouette */}
          <path
            d="M 230 180 Q 250 250 210 320 T 220 440"
            fill="none"
            stroke="#1b4327"
            strokeWidth="38"
            strokeLinecap="round"
            opacity="0.25"
          />

          {/* 1. Draw All Background Road Edges */}
          <g className="edges-layer">
            {ROAD_EDGES.map((edge, index) => {
              const n1 = getNode(edge.from);
              const n2 = getNode(edge.to);
              if (!n1 || !n2) return null;

              // Check if this edge is part of the active selected route
              const isSelectedEdge = selectedRoute.edges?.some(
                e => (e.from === edge.from && e.to === edge.to) || (e.from === edge.to && e.to === edge.from)
              );

              if (isSelectedEdge) return null; // Drawn on top layer

              return (
                <g key={`bg-edge-${index}`} className="group">
                  {/* Road Base */}
                  <line
                    x1={n1.coordinates.x}
                    y1={n1.coordinates.y}
                    x2={n2.coordinates.x}
                    y2={n2.coordinates.y}
                    stroke="#1c3823"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {/* Traffic Overlay */}
                  <line
                    x1={n1.coordinates.x}
                    y1={n1.coordinates.y}
                    x2={n2.coordinates.x}
                    y2={n2.coordinates.y}
                    stroke={getTrafficStrokeColor(edge.trafficLevel)}
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                    opacity="0.5"
                  />
                </g>
              );
            })}
          </g>

          {/* 2. Draw Selected Optimal Route (Highlighted Glowing Path) */}
          <g className="active-route-layer">
            {selectedRoute.pathNodes && selectedRoute.pathNodes.length > 1 && (
              <>
                {/* Glow Outer Path */}
                <path
                  d={selectedRoute.pathNodes.reduce(
                    (acc, node, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${node.coordinates.x} ${node.coordinates.y}`,
                    ''
                  )}
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.3"
                  filter="url(#glow)"
                />

                {/* Solid Core Path */}
                <path
                  d={selectedRoute.pathNodes.reduce(
                    (acc, node, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${node.coordinates.x} ${node.coordinates.y}`,
                    ''
                  )}
                  fill="none"
                  stroke="url(#routeGlowGrad)"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Animated Direction Arrows / Dashes along Path */}
                <path
                  d={selectedRoute.pathNodes.reduce(
                    (acc, node, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${node.coordinates.x} ${node.coordinates.y}`,
                    ''
                  )}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeDasharray="8,16"
                  strokeLinecap="round"
                  className="animate-pulse"
                  opacity="0.85"
                />
              </>
            )}
          </g>

          {/* 3. Draw All Road Nodes (Hubs & Junctions) */}
          <g className="nodes-layer">
            {ROAD_NODES.map((node) => {
              const isStart = node.id === startNodeId;
              const isGoal = node.id === goalNodeId;
              const isAlongRoute = selectedRoute.pathNodeIds?.includes(node.id);

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.coordinates.x}, ${node.coordinates.y})`}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setActiveHoverNode(node)}
                  onMouseLeave={() => setActiveHoverNode(null)}
                >
                  {/* Outer Pulsing Beacon for Start & Goal */}
                  {(isStart || isGoal) && (
                    <circle
                      r="16"
                      fill={isStart ? '#22c55e' : '#3b82f6'}
                      opacity="0.3"
                      className="animate-ping"
                    />
                  )}

                  {/* Node Outer Circle */}
                  <circle
                    r={isStart || isGoal ? 9 : isAlongRoute ? 6.5 : 4.5}
                    fill={
                      isStart 
                        ? '#22c55e' 
                        : isGoal 
                        ? '#3b82f6' 
                        : isAlongRoute 
                        ? '#166534' 
                        : '#1a3320'
                    }
                    stroke={
                      isStart 
                        ? '#ffffff' 
                        : isGoal 
                        ? '#ffffff' 
                        : isAlongRoute 
                        ? '#4ade80' 
                        : '#295233'
                    }
                    strokeWidth={isStart || isGoal ? 2.5 : isAlongRoute ? 1.5 : 1}
                  />

                  {/* Inner Node Dot */}
                  <circle
                    r={isStart || isGoal ? 3.5 : 2}
                    fill="#ffffff"
                  />

                  {/* Node Label Text */}
                  <text
                    x={isStart || isGoal ? 13 : 9}
                    y={isStart || isGoal ? 4 : 3}
                    fill={
                      isStart 
                        ? '#86efac' 
                        : isGoal 
                        ? '#93c5fd' 
                        : isAlongRoute 
                        ? '#f3f4f6' 
                        : '#9ca3af'
                    }
                    fontSize={isStart || isGoal ? "11" : isAlongRoute ? "9.5" : "8"}
                    fontWeight={isStart || isGoal ? "bold" : isAlongRoute ? "600" : "normal"}
                    className="select-none pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                  >
                    {node.name.replace(/ Agro Hub| Mandi| Freight Center| Gateway| Depot| Link| Pass| Junction| Point| Hub/g, '')}
                  </text>
                </g>
              );
            })}
          </g>

          {/* 4. Animated Transport Vehicle (Truck) on Live Simulation */}
          <g transform={`translate(${truckPos.x}, ${truckPos.y}) rotate(${truckPos.angle})`}>
            {/* Pulsing Beacon around Vehicle */}
            <circle r="14" fill="#22c55e" opacity="0.4" className="animate-ping" />
            
            {/* Vehicle Background Circle */}
            <circle r="10" fill="#166534" stroke="#ffffff" strokeWidth="2" shadow-md="true" />
            
            {/* Truck Icon Pointer */}
            <g transform="translate(-6, -6) scale(0.55)">
              <Truck className="w-5 h-5 text-white" />
            </g>
          </g>

        </svg>

        {/* Hovered Node Tooltip HUD */}
        {activeHoverNode && (
          <div className="absolute bottom-14 left-4 bg-[#0a1b0f]/95 border border-[#22c55e]/40 p-2.5 rounded-input shadow-xl backdrop-blur-md max-w-xs z-30 animate-fade-in pointer-events-none">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary-light" />
              <span className="font-bold text-xs text-white">{activeHoverNode.name}</span>
            </div>
            {activeHoverNode.hindiName && (
              <span className="text-[10px] text-gray-400 block">{activeHoverNode.hindiName}</span>
            )}
            {activeHoverNode.description && (
              <p className="text-[10px] text-gray-300 mt-1 leading-snug">{activeHoverNode.description}</p>
            )}
          </div>
        )}

      </div>

      {/* Bottom Summary Bar on Map */}
      <div className="bg-[#091a0e] border-t border-[#1b3e23] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Left: Origin to Goal */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold text-gray-200">
            <span className="w-2.5 h-2.5 rounded-full bg-accent inline-block animate-pulse" />
            <span className="text-accent-light">{startNode.name.split(' ')[0]}</span>
            <span className="text-gray-500">➔</span>
            <span className="text-blue-400">{goalNode.name.split(' ')[0]}</span>
          </div>
          <span className="text-[10px] text-gray-400 hidden md:inline">
            via {selectedRoute.highwaySummary}
          </span>
        </div>

        {/* Right: Quick Telemetry Chips */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-gray-300 font-semibold">
            <Navigation className="w-3.5 h-3.5 text-primary-light" />
            <span>{selectedRoute.totalDistanceKm} km</span>
          </div>

          <div className="flex items-center gap-1 text-gray-300 font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {Math.floor(selectedRoute.totalDurationMinutes / 60)}h {selectedRoute.totalDurationMinutes % 60}m
            </span>
          </div>

          <div className="flex items-center gap-1 text-emerald-400 font-bold font-mono">
            <IndianRupee className="w-3.5 h-3.5" />
            <span>{selectedRoute.totalCostEstimate.toLocaleString('en-IN')}</span>
          </div>
        </div>

      </div>

    </div>
  );
};
