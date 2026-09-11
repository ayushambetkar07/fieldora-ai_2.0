import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  TransportBooking, 
  TransportVehicle, 
  RouteOptimizationResult, 
  TransportStatus,
  AStarCostWeights
} from '../../types/transport';
import { 
  ROAD_NODES, 
  calculateOptimizedRoutes, 
  matchVehiclesForPayload, 
  formatDurationHoursMins,
  DEFAULT_ASTAR_WEIGHTS
} from '../../services/aStarRouting';
import { 
  Truck, 
  Navigation, 
  Sparkles, 
  MapPin, 
  Clock, 
  IndianRupee, 
  Calendar, 
  CheckCircle2, 
  ArrowRight, 
  Calculator, 
  ShieldCheck, 
  TrendingDown, 
  ChevronRight, 
  Layers, 
  RotateCcw,
  Zap,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Button, Card, Input, Select, Badge, cn } from '../../components/ui';
import { RouteVisualizerMap } from '../../components/transport/RouteVisualizerMap';
import { VehicleSelectionCard } from '../../components/transport/VehicleSelectionCard';
import { AStarExplainerModal } from '../../components/transport/AStarExplainerModal';
import { TransportTracker } from '../../components/transport/TransportTracker';
import { fetchTransportOptionsApi, TransportOptionDto } from '../../services/supabaseService';

export const SmartTransportPage: React.FC = () => {
  const { userRole, ordersList, showToast, dispatchOrder } = useApp();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const orderIdParam = searchParams.get('orderId');
  const matchedOrder = ordersList.find(o => o.id === orderIdParam || o.orderNumber === orderIdParam);

  // -------------------------------------------------------------
  // 1. Cargo & Location State
  // -------------------------------------------------------------
  const [pickupNodeId, setPickupNodeId] = useState<string>('NODE-NASHIK');
  const [deliveryNodeId, setDeliveryNodeId] = useState<string>('NODE-MUMBAI-APMC');
  const [commodity, setCommodity] = useState<string>(matchedOrder?.crop || 'Onion');
  const [quantityValue, setQuantityValue] = useState<number>(
    matchedOrder ? (matchedOrder.unit === 'quintal' ? matchedOrder.quantity * 100 : matchedOrder.quantity) : 800
  );
  const [deliveryDate, setDeliveryDate] = useState<string>(
    matchedOrder?.expectedDeliveryDate || '2026-09-02'
  );

  // -------------------------------------------------------------
  // 2. A* Algorithm & Routing State
  // -------------------------------------------------------------
  const [aStarWeights, setAStarWeights] = useState<AStarCostWeights>(DEFAULT_ASTAR_WEIGHTS);
  const [calculatedRoutes, setCalculatedRoutes] = useState<RouteOptimizationResult[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteOptimizationResult | null>(null);

  // -------------------------------------------------------------
  // 3. Vehicles & Backend Dynamic Transport State
  // -------------------------------------------------------------
  const [availableVehicles, setAvailableVehicles] = useState<TransportVehicle[]>([]);
  const [transportOptions, setTransportOptions] = useState<TransportOptionDto[]>([]);
  const [suitableCount, setSuitableCount] = useState<number>(0);
  const [isLoadingTransport, setIsLoadingTransport] = useState<boolean>(false);
  const [transportError, setTransportError] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [vehicleCosts, setVehicleCosts] = useState<Map<string, number>>(new Map());

  // -------------------------------------------------------------
  // 4. UI / Stepper State
  // -------------------------------------------------------------
  const [activeStep, setActiveStep] = useState<'configure' | 'confirmed'>('configure');
  const [isAStarModalOpen, setIsAStarModalOpen] = useState(false);
  const [activeBooking, setActiveBooking] = useState<TransportBooking | null>(null);

  // Live simulation state
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [isSimulatingLive, setIsSimulatingLive] = useState(false);

  // Re-run A* optimization when locations or weights change
  useEffect(() => {
    const routes = calculateOptimizedRoutes(pickupNodeId, deliveryNodeId, aStarWeights);
    setCalculatedRoutes(routes);
    if (routes.length > 0) {
      setSelectedRoute(routes[0]);
    }
  }, [pickupNodeId, deliveryNodeId, aStarWeights]);

  // Dynamic Backend Transport Options Fetching
  const loadDynamicTransportOptions = async () => {
    setIsLoadingTransport(true);
    setTransportError(null);
    try {
      const pNode = ROAD_NODES.find(n => n.id === pickupNodeId);
      const dNode = ROAD_NODES.find(n => n.id === deliveryNodeId);
      const pickupLoc = pNode ? pNode.name : 'Nashik';
      const destLoc = dNode ? dNode.name : 'Mumbai';

      const result = await fetchTransportOptionsApi({
        pickupLocation: pickupLoc,
        destination: destLoc,
        crop: commodity,
        quantityKg: quantityValue
      });

      if (result && Array.isArray(result.options)) {
        setTransportOptions(result.options);
        setSuitableCount(result.suitableCount);

        // Find Best Match from backend response
        const best = result.options.find(o => o.isBestMatch) || result.options.find(o => o.isSuitable);
        if (best) {
          setSelectedVehicle(best);
        } else if (result.options.length > 0) {
          setSelectedVehicle(result.options[0]);
        }
      }
    } catch (err: any) {
      console.warn('Transport options load warning:', err);
      setTransportError(err?.message || 'Failed to fetch transport fleet options');
    } finally {
      setIsLoadingTransport(false);
    }
  };

  useEffect(() => {
    loadDynamicTransportOptions();
  }, [pickupNodeId, deliveryNodeId, commodity, quantityValue]);

  // Load existing active booking if order is already dispatched / in transit
  useEffect(() => {
    if (matchedOrder && (matchedOrder.status === 'In Transit' || matchedOrder.status === 'Arrived' || matchedOrder.status === 'Quality Verified' || matchedOrder.status === 'Completed')) {
      const routes = calculateOptimizedRoutes(pickupNodeId, deliveryNodeId, aStarWeights);
      const chosenRoute = routes[0] || selectedRoute;
      const { recommendedVehicle } = matchVehiclesForPayload(quantityValue, chosenRoute?.totalDistanceKm || 165);
      const vehicle = selectedVehicle || recommendedVehicle;

      const progress = matchedOrder.status === 'In Transit' ? 50 : 100;
      const initialBooking: TransportBooking = {
        id: `TR-${matchedOrder.orderNumber.replace(/[^0-9]/g, '').slice(-4) || '1042'}`,
        orderId: matchedOrder.id,
        orderNumber: matchedOrder.orderNumber,
        crop: matchedOrder.crop,
        quantity: matchedOrder.quantity,
        unit: matchedOrder.unit,
        weightKg: quantityValue,
        pickupLocation: 'Nashik Farm-Gate Origin',
        pickupNodeId,
        deliveryLocation: matchedOrder.deliveryLocation || 'Mumbai APMC Hub',
        deliveryNodeId,
        deliveryDate: matchedOrder.expectedDeliveryDate || 'Today',
        farmerName: matchedOrder.farmerName,
        farmerPhone: '+91 98234 11200',
        buyerName: matchedOrder.buyerName,
        buyerCompany: matchedOrder.buyerCompany,
        buyerPhone: '+91 99870 54321',
        selectedVehicle: vehicle,
        selectedRoute: chosenRoute,
        totalTransportCost: 2400,
        status: matchedOrder.status === 'In Transit' ? 'In Transit' : 'Buyer Delivery',
        currentProgressPercent: progress,
        currentCheckpoint: matchedOrder.status === 'In Transit' ? 'In Transit - Express Corridor' : 'Delivered at Buyer APMC Hub',
        eta: chosenRoute ? formatDurationHoursMins(chosenRoute.totalDurationMinutes) : '2h 45m',
        currentSpeedKmH: matchedOrder.status === 'In Transit' ? 58 : 0,
        temperatureControlled: false,
        weighbridgeAssayVerified: true,
        createdDate: matchedOrder.orderDate || new Date().toLocaleDateString('en-IN'),
        trackingSteps: [
          { status: 'Vehicle Assigned', label: 'Vehicle Assigned', hindiLabel: 'वाहन आवंटित', description: 'Driver confirmed trip', completed: true, current: false },
          { status: 'Farmer Pickup', label: 'Farmer Pickup', hindiLabel: 'किसान खेत लोडिंग', description: 'Farm-gate pickup completed', completed: true, current: false },
          { status: 'In Transit', label: 'In Transit', hindiLabel: 'रास्ते में', description: 'Direct highway transit', completed: matchedOrder.status !== 'In Transit', current: matchedOrder.status === 'In Transit' },
          { status: 'Buyer Delivery', label: 'Buyer Delivery', hindiLabel: 'खरीदार डिलीवरी', description: 'Destination arrival & weighment', completed: matchedOrder.status !== 'In Transit', current: matchedOrder.status !== 'In Transit' },
        ]
      };

      setActiveBooking(initialBooking);
      setActiveStep('confirmed');
      setSimulationProgress(progress);
    }
  }, [matchedOrder?.id, matchedOrder?.status]);

  // Task 4: Ingest real-time GPS telemetry to backend
  const sendGpsTelemetry = async (progressPercent: number, checkpointName: string, lat: number, lng: number, speed: number) => {
    try {
      const defaultApi = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
        ? 'http://localhost:5000'
        : (typeof window !== 'undefined' ? window.location.origin : '');
      const apiUrl = (import.meta as any).env?.VITE_API_URL || defaultApi;
      const orderId = matchedOrder?.id || activeBooking?.orderId || activeBooking?.id || orderIdParam || 'TR-1042';
      await fetch(`${apiUrl}/api/orders/${orderId}/gps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          speed_kmh: speed,
          heading: 210,
          checkpoint_name: checkpointName,
          progress_percent: progressPercent,
          eta: activeBooking?.eta || '2h 45m'
        })
      });
    } catch (err) {
      console.warn('GPS Telemetry send error:', err);
    }
  };

  // Handle Simulation Animation Loop
  useEffect(() => {
    let timer: any;
    if (isSimulatingLive) {
      timer = setInterval(() => {
        setSimulationProgress(prev => {
          if (prev >= 100) {
            setIsSimulatingLive(false);
            if (activeBooking) {
              setActiveBooking({
                ...activeBooking,
                status: 'Buyer Delivery',
                currentProgressPercent: 100,
                currentCheckpoint: 'Delivered at Buyer Hub'
              });
              sendGpsTelemetry(100, 'Delivered at Buyer Hub - Destination', 19.0760, 72.8777, 0);
            }
            return 100;
          }
          const next = prev + 5;
          if (activeBooking) {
            const checkpoint = next < 30 ? 'Igatpuri Pass' : next < 70 ? 'Kasara Freight Junction' : 'Thane Toll Plaza';
            const lat = next < 30 ? 19.6967 : next < 70 ? 19.5358 : 19.2183;
            const lng = next < 30 ? 73.5638 : next < 70 ? 73.4831 : 72.9781;
            const speed = next < 30 ? 58 : next < 70 ? 62 : 45;

            if (next === 25 || next === 50 || next === 75) {
              sendGpsTelemetry(next, checkpoint, lat, lng, speed);
            }

            setActiveBooking({
              ...activeBooking,
              status: next > 20 && next < 90 ? 'In Transit' : activeBooking.status,
              currentProgressPercent: next,
              currentCheckpoint: checkpoint
            });
          }
          return next;
        });
      }, 600);
    }
    return () => clearInterval(timer);
  }, [isSimulatingLive, activeBooking]);

  // Calculate final combined transport cost
  const finalCost = (selectedVehicle && selectedRoute)
    ? (vehicleCosts.get(selectedVehicle.id) || selectedRoute.totalCostEstimate) + selectedRoute.totalTollCost
    : 2400;

  // Handler: Confirm Transport
  const handleConfirmTransport = async () => {
    if (!selectedVehicle || !selectedRoute) return;

    const bookingId = `TR-${Math.floor(1000 + Math.random() * 9000)}`;
    const pickupNode = ROAD_NODES.find(n => n.id === pickupNodeId);
    const deliveryNode = ROAD_NODES.find(n => n.id === deliveryNodeId);

    const newBooking: TransportBooking = {
      id: bookingId,
      orderId: matchedOrder?.id,
      orderNumber: matchedOrder?.orderNumber,
      crop: commodity,
      quantity: matchedOrder ? matchedOrder.quantity : Math.round(quantityValue / 100),
      unit: matchedOrder ? matchedOrder.unit : 'quintal',
      weightKg: quantityValue,
      pickupLocation: pickupNode?.name || 'Nashik Farm Cluster',
      pickupNodeId,
      deliveryLocation: deliveryNode?.name || 'Mumbai APMC Hub',
      deliveryNodeId,
      deliveryDate,
      farmerName: matchedOrder ? matchedOrder.farmerName : 'Rajendra Patel (Farmer)',
      farmerPhone: '+91 98234 11200',
      buyerName: matchedOrder ? matchedOrder.buyerName : 'Sanjay Deshmukh (Buyer)',
      buyerCompany: matchedOrder ? matchedOrder.buyerCompany : 'ABC Foods & Retail Ltd',
      buyerPhone: '+91 99870 54321',
      selectedVehicle,
      selectedRoute,
      totalTransportCost: finalCost,
      status: 'Vehicle Assigned',
      currentProgressPercent: 15,
      currentCheckpoint: 'Dispatch Assigned at ' + (pickupNode?.name.split(' ')[0] || 'Nashik'),
      eta: formatDurationHoursMins(selectedRoute.totalDurationMinutes),
      currentSpeedKmH: 0,
      temperatureControlled: false,
      weighbridgeAssayVerified: true,
      createdDate: new Date().toLocaleDateString('en-IN'),
      trackingSteps: [
        { status: 'Vehicle Assigned', label: 'Vehicle Assigned', hindiLabel: 'वाहन आवंटित', description: 'Driver confirmed trip', completed: true, current: true },
        { status: 'Farmer Pickup', label: 'Farmer Pickup', hindiLabel: 'किसान खेत लोडिंग', description: 'Arriving at farm-gate', completed: false, current: false },
        { status: 'In Transit', label: 'In Transit', hindiLabel: 'रास्ते में', description: 'Non-stop direct transit', completed: false, current: false },
        { status: 'Buyer Delivery', label: 'Buyer Delivery', hindiLabel: 'खरीदार डिलीवरी', description: 'Assay verified', completed: false, current: false },
      ]
    };

    setActiveBooking(newBooking);
    setActiveStep('confirmed');
    setSimulationProgress(15);

    if (matchedOrder?.id) {
      await dispatchOrder(matchedOrder.id, {
        vehicleId: selectedVehicle.id,
        vehicleName: selectedVehicle.name,
        vehicleType: selectedVehicle.type,
        vehicleNumber: selectedVehicle.vehicleNumber,
        driverName: selectedVehicle.driverName,
        driverPhone: selectedVehicle.driverPhone,
        pickupLocation: newBooking.pickupLocation,
        deliveryLocation: newBooking.deliveryLocation,
        pickupNodeId,
        deliveryNodeId,
        routeId: selectedRoute.id,
        estimatedDistanceKm: selectedRoute.totalDistanceKm,
        estimatedDurationMinutes: selectedRoute.totalDurationMinutes,
        estimatedTollCost: selectedRoute.totalTollCost
      });
      sendGpsTelemetry(15, newBooking.currentCheckpoint, 19.9975, 73.7898, 0);
    }

    showToast(
      'Transport Confirmed! 🚚',
      `Direct transport booked with ${selectedVehicle.driverName} (${selectedVehicle.vehicleNumber}) for ₹${finalCost.toLocaleString('en-IN')}`,
      'success'
    );
  };

  const handleUpdateStatus = (newStatus: TransportStatus, progress: number) => {
    if (!activeBooking) return;
    setActiveBooking({
      ...activeBooking,
      status: newStatus,
      currentProgressPercent: progress
    });
    setSimulationProgress(progress);

    const checkpointName = newStatus === 'Farmer Pickup'
      ? 'Farmer Farm-Gate Pickup - Tare Weighment'
      : newStatus === 'In Transit'
      ? 'In Transit - Igatpuri Express Corridor'
      : newStatus === 'Buyer Delivery' || newStatus === 'Completed'
      ? 'Buyer Delivery - Destination APMC Hub'
      : 'Nashik Agro Hub - Vehicle Assigned';

    const lat = newStatus === 'Farmer Pickup' ? 19.9975 : newStatus === 'In Transit' ? 19.6967 : 19.0760;
    const lng = newStatus === 'Farmer Pickup' ? 73.7898 : newStatus === 'In Transit' ? 73.5638 : 72.8777;
    const speed = newStatus === 'In Transit' ? 58 : 0;

    sendGpsTelemetry(progress, checkpointName, lat, lng, speed);
    showToast('Shipment Updated', `Status changed to: ${newStatus}`, 'info');
  };

  const handleSimulateFullTrip = () => {
    setSimulationProgress(0);
    setIsSimulatingLive(true);
    sendGpsTelemetry(5, 'Nashik Agro Hub - Loading & Dispatch', 19.9975, 73.7898, 25);
    showToast('Simulation Started', 'Simulating direct farm-to-buyer GPS transit along A* route', 'info');
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#166534] text-white flex items-center gap-1 shadow-2xs">
              <Truck className="w-3.5 h-3.5 text-[#4ade80]" />
              <span>Smart Direct Transport</span>
            </span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-extrabold text-main font-heading tracking-tight">
            Direct Farm-to-Buyer Route Optimizer
          </h1>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {activeStep === 'confirmed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveStep('configure')}
              className="flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Modify Route / Vehicle</span>
            </Button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* VIEW A: CONFIGURE & OPTIMIZE VIEW */}
      {/* ------------------------------------------------------------- */}
      {activeStep === 'configure' && selectedRoute && selectedVehicle && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Parameters & Vehicle Selector (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* 1. Pickup, Delivery & Cargo Form */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-sm text-main font-heading">
                  Order & Freight Parameters
                </h3>
                {matchedOrder && (
                  <span className="text-[11px] font-mono font-bold text-primary bg-[#E8F3EB] px-2 py-0.5 rounded">
                    Order #{matchedOrder.orderNumber}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Farmer / Pickup Hub */}
                <Select
                  label="Farmer / Pickup Location"
                  value={pickupNodeId}
                  onChange={(e) => setPickupNodeId(e.target.value)}
                  options={ROAD_NODES.filter(n => n.isFarmingHub || n.coordinates.y < 250).map(n => ({
                    value: n.id,
                    label: n.name
                  }))}
                />

                {/* Buyer / Delivery Hub */}
                <Select
                  label="Buyer / Delivery Hub"
                  value={deliveryNodeId}
                  onChange={(e) => setDeliveryNodeId(e.target.value)}
                  options={ROAD_NODES.filter(n => n.isBuyerHub || n.coordinates.y > 250).map(n => ({
                    value: n.id,
                    label: n.name
                  }))}
                />

                {/* Product / Crop */}
                <Input
                  label="Crop / Commodity"
                  value={commodity}
                  onChange={(e) => setCommodity(e.target.value)}
                  placeholder="e.g. Onion, Tomato, Potato"
                />

                {/* Total Payload Weight */}
                <Input
                  label="Payload Weight (kg)"
                  type="number"
                  value={quantityValue}
                  onChange={(e) => setQuantityValue(Math.max(10, parseInt(e.target.value) || 0))}
                  helperText={`${(quantityValue / 100).toFixed(1)} Quintals`}
                />
              </div>
            </Card>

            {/* 2. Vehicle Matching Fleet */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-main font-heading">
                    Available Transport Vehicles
                  </h3>
                  <p className="text-xs text-secondary">
                    Matched dynamically for <strong>{quantityValue.toLocaleString('en-IN')} kg</strong> payload
                  </p>
                </div>
                <span className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded-full border",
                  suitableCount > 0 
                    ? "text-primary bg-[#F0FDF4] border-[#bbf7d0]" 
                    : "text-amber-700 bg-amber-50 border-amber-200"
                )}>
                  {isLoadingTransport ? 'Matching...' : (suitableCount > 0 ? `${suitableCount} Suitable` : 'No Suitable Vehicles')}
                </span>
              </div>

              {/* Loading State */}
              {isLoadingTransport && transportOptions.length === 0 && (
                <div className="p-8 text-center bg-card rounded-card border border-border space-y-2">
                  <RefreshCw className="w-5 h-5 text-primary animate-spin mx-auto" />
                  <p className="text-xs text-secondary font-medium">Fetching real-time transport fleet & freight rates...</p>
                </div>
              )}

              {/* Error State with Retry */}
              {transportError && (
                <div className="p-4 bg-error-light/50 border border-error-light rounded-card flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-error">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{transportError}</span>
                  </div>
                  <button
                    onClick={loadDynamicTransportOptions}
                    className="px-3 py-1 bg-white border border-error text-error font-bold rounded-button hover:bg-error hover:text-white transition-colors flex items-center gap-1 shrink-0"
                  >
                    <RefreshCw className="w-3 h-3" /> Retry
                  </button>
                </div>
              )}

              {/* Empty State when no suitable vehicle exists */}
              {!isLoadingTransport && suitableCount === 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-card text-xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>No Suitable Transporter for {quantityValue.toLocaleString('en-IN')} kg</span>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    The requested payload exceeds standard direct vehicles in this corridor. Try adjusting cargo weight or contacting Fieldora logistics dispatch.
                  </p>
                </div>
              )}

              {/* Transport Vehicle Cards */}
              <div className="space-y-3">
                {(transportOptions.length > 0 ? transportOptions : availableVehicles).map((vehicle: any) => {
                  const tripCost = vehicle.estimatedFreight !== undefined
                    ? vehicle.estimatedFreight + (selectedRoute?.totalTollCost || 0)
                    : (vehicleCosts.get(vehicle.id) || 0) + (selectedRoute?.totalTollCost || 0);

                  const isRec = vehicle.isBestMatch !== undefined
                    ? vehicle.isBestMatch
                    : vehicle.id === availableVehicles.find(v => v.capacityKg >= quantityValue)?.id;

                  const isSelected = selectedVehicle?.id === vehicle.id;

                  return (
                    <VehicleSelectionCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      orderWeightKg={quantityValue}
                      routeDistanceKm={selectedRoute?.totalDistanceKm || 165}
                      calculatedCost={tripCost}
                      isSelected={isSelected}
                      isRecommended={isRec}
                      matchScore={vehicle.matchScore}
                      loadingPercentage={vehicle.loadingPercentage}
                      onSelect={(veh) => setSelectedVehicle(veh)}
                    />
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Map & Recommendation Card (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Vector Route Map */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-main font-heading flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-primary" />
                  <span>Direct Highway Road Network & Corridor</span>
                </h3>
                <span className="text-xs text-secondary font-mono">
                  {selectedRoute.pathNodes.length} Waypoint Nodes
                </span>
              </div>

              <RouteVisualizerMap
                selectedRoute={selectedRoute}
                allRoutes={calculatedRoutes}
                onSelectRoute={(r) => setSelectedRoute(r)}
                startNodeId={pickupNodeId}
                goalNodeId={deliveryNodeId}
                isSimulatingLive={isSimulatingLive}
                simulationProgress={simulationProgress}
              />
            </div>

            {/* 2. Route Options Selection Cards */}
            {calculatedRoutes.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {calculatedRoutes.slice(0, 2).map((route, idx) => {
                  const isSelected = selectedRoute.id === route.id;
                  const isOptimal = idx === 0;
                  const routeTripCost = (selectedVehicle ? (vehicleCosts.get(selectedVehicle.id) || route.totalCostEstimate) : route.totalCostEstimate) + route.totalTollCost;

                  return (
                    <div
                      key={route.id}
                      onClick={() => setSelectedRoute(route)}
                      className={cn(
                        "p-4 rounded-xl cursor-pointer transition-all border-2 space-y-2 bg-white",
                        isSelected
                          ? "border-[#166534] ring-1 ring-[#166534]/30 shadow-sm"
                          : "border-border hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={cn(
                            "w-2.5 h-2.5 rounded-full shrink-0",
                            isOptimal ? "bg-[#22c55e]" : "bg-amber-500"
                          )} />
                          <span className="font-bold text-xs text-main">
                            {isOptimal ? '(Direct Recommended Optimal)' : 'Alternative (Kalyan Bypass)'}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-sm text-main">
                          ₹{routeTripCost.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-secondary font-mono">
                        <span className="flex items-center gap-1">
                          <Navigation className="w-3 h-3 text-muted" />
                          <span>{route.totalDistanceKm} km</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-muted" />
                          <span>{formatDurationHoursMins(route.totalDurationMinutes)}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            route.overallTraffic === 'Low' ? 'bg-accent' : route.overallTraffic === 'Moderate' ? 'bg-warning-dark' : 'bg-error'
                          )} />
                          <span>{route.overallTraffic} Traffic</span>
                        </span>
                      </div>

                      <p className="text-[11px] text-muted leading-tight">
                        {isOptimal 
                          ? `${ROAD_NODES.find(n => n.id === pickupNodeId)?.name.split(' ')[0] || 'Nashik'} ➔ Igatpuri ➔ ${ROAD_NODES.find(n => n.id === deliveryNodeId)?.name.split(' ')[0] || 'Mumbai'} (Direct Highway)`
                          : 'Bypasses urban bottleneck with higher distance'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 3. Fieldora Smart Recommendation Card */}
            <div className="p-5 bg-gradient-to-br from-[#166534] to-[#0d3b1e] text-white rounded-card shadow-card space-y-4 border border-[#22c55e]/30">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                  <Sparkles className="w-5 h-5 text-[#4ade80]" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-heading font-extrabold text-base text-white flex items-center gap-2">
                    <span>Fieldora Recommendation</span>
                  </h4>
                  <p className="text-xs text-gray-200 leading-relaxed">
                    This vehicle has enough capacity for your order and provides the lowest estimated transportation cost while meeting the delivery deadline.
                  </p>
                </div>
              </div>

              {/* Action Button & Selected Info */}
              <div className="pt-2 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-gray-200 flex items-center gap-2">
                  <span>Selected: <strong>{selectedVehicle.name}</strong></span>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleConfirmTransport}
                  className="bg-[#22c55e] text-[#06240f] hover:bg-[#4ade80] font-bold shadow-lg flex items-center gap-2"
                >
                  <Truck className="w-4 h-4" />
                  <span>Confirm Transport</span>
                </Button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW B: CONFIRMED & LIVE TRACKING VIEW */}
      {/* ------------------------------------------------------------- */}
      {activeStep === 'confirmed' && activeBooking && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Tracking Subheader */}
          <div className="flex items-center justify-between bg-[#F4F9F5] border border-[#166534]/30 p-4 rounded-card">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-accent" />
              <div>
                <span className="font-bold text-sm text-primary block">
                  Direct Transport Booked & Active!
                </span>
                <span className="text-xs text-secondary">
                  Direct pickup from {activeBooking.farmerName} ➔ Delivery to {activeBooking.buyerCompany}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSimulateFullTrip()}
              className="text-xs"
            >
              <Zap className="w-3.5 h-3.5 mr-1 text-accent" />
              Simulate Live GPS Transit
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Interactive GPS Route Visualizer (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-main font-heading flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-primary" />
                  <span>Live Vehicle GPS Location</span>
                </h3>
                <span className="text-xs text-accent font-bold font-mono">
                  {simulationProgress}% Completed
                </span>
              </div>

              <RouteVisualizerMap
                selectedRoute={activeBooking.selectedRoute}
                startNodeId={activeBooking.pickupNodeId}
                goalNodeId={activeBooking.deliveryNodeId}
                isSimulatingLive={isSimulatingLive}
                simulationProgress={simulationProgress}
              />

              {/* Direct Route Highway Telemetry */}
              <div className="p-4 bg-[#F7F9F6] border border-border rounded-input flex items-center justify-between text-xs">
                <div>
                  <span className="text-muted block text-[10px] uppercase font-semibold">Corridor</span>
                  <span className="font-bold text-main">{activeBooking.selectedRoute.highwaySummary}</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase font-semibold">Total Distance</span>
                  <span className="font-bold text-main font-mono">{activeBooking.selectedRoute.totalDistanceKm} km</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase font-semibold">Est. Arrival</span>
                  <span className="font-bold text-primary font-mono">{activeBooking.eta}</span>
                </div>
              </div>
            </div>

            {/* Right: Milestone Stepper & Driver Card (6 cols) */}
            <div className="lg:col-span-6">
              <TransportTracker
                booking={activeBooking}
                onUpdateStatus={handleUpdateStatus}
                onSimulateFullTrip={handleSimulateFullTrip}
                isSimulatingLive={isSimulatingLive}
              />
            </div>

          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. A* Math Explainer Modal */}
      {/* ------------------------------------------------------------- */}
      {selectedRoute && (
        <AStarExplainerModal
          isOpen={isAStarModalOpen}
          onClose={() => setIsAStarModalOpen(false)}
          selectedRoute={selectedRoute}
          currentWeights={aStarWeights}
          onUpdateWeights={(newWeights) => {
            setAStarWeights(newWeights);
            setIsAStarModalOpen(false);
            showToast('A* Weights Applied', 'Recalculated route cost with custom weights', 'success');
          }}
        />
      )}

    </div>
  );
};
