import {
  RoadNode,
  RoadEdge,
  AStarCostWeights,
  RouteOptimizationResult,
  TransportVehicle,
  AStarStepLog,
  TrafficLevel
} from '../types/transport';

// -------------------------------------------------------------
// 1. Regional Road Network Graph Nodes
// -------------------------------------------------------------
export const ROAD_NODES: RoadNode[] = [
  {
    id: 'NODE-NASHIK',
    name: 'Nashik Agro Hub',
    hindiName: 'नाशिक ऍग्रो हब',
    state: 'Maharashtra',
    coordinates: { x: 260, y: 110, lat: 19.9975, lng: 73.7898 },
    isFarmingHub: true,
    description: 'Major Onion, Tomato, and Grape production center.'
  },
  {
    id: 'NODE-LASALGAON',
    name: 'Lasalgaon Mandi',
    hindiName: 'लासलगाव मंडी',
    state: 'Maharashtra',
    coordinates: { x: 370, y: 80, lat: 20.1472, lng: 74.2257 },
    isFarmingHub: true,
    description: "Asia's largest onion farm-gate market cluster."
  },
  {
    id: 'NODE-PIMPALGAON',
    name: 'Pimpalgaon Baswant',
    hindiName: 'पिंपळगाव बसवंत',
    state: 'Maharashtra',
    coordinates: { x: 310, y: 70, lat: 20.1691, lng: 73.9847 },
    isFarmingHub: true,
    description: 'Premier tomato, capsicum, and vegetable farm cluster.'
  },
  {
    id: 'NODE-SINNAR',
    name: 'Sinnar Industrial Link',
    hindiName: 'सिन्नर इंडस्ट्रियल लिंक',
    state: 'Maharashtra',
    coordinates: { x: 300, y: 170, lat: 19.8516, lng: 73.9967 },
    isFarmingHub: true,
    description: 'Expressway access point and cold storage hub.'
  },
  {
    id: 'NODE-IGATPURI',
    name: 'Igatpuri Ghat Pass',
    hindiName: 'इगतपुरी घाट पास',
    state: 'Maharashtra',
    coordinates: { x: 240, y: 220, lat: 19.6967, lng: 73.5638 },
    description: 'Thal Ghat mountain corridor connecting Nashik to Konkan.'
  },
  {
    id: 'NODE-KASARA',
    name: 'Kasara Freight Junction',
    hindiName: 'कसारा फ्रेट जंक्शन',
    state: 'Maharashtra',
    coordinates: { x: 220, y: 270, lat: 19.6465, lng: 73.4795 },
    description: 'Descent checkpoint with weighbridge inspection station.'
  },
  {
    id: 'NODE-SHAHAPUR',
    name: 'Shahapur Logistics Point',
    hindiName: 'शहापूर लॉजिस्टिक्स पॉइंट',
    state: 'Maharashtra',
    coordinates: { x: 210, y: 320, lat: 19.4549, lng: 73.3308 },
    description: 'Samruddhi Mahamarg feeder route and national highway link.'
  },
  {
    id: 'NODE-BHIWANDI',
    name: 'Bhiwandi Freight Center',
    hindiName: 'भिवंडी फ्रेट सेंटर',
    state: 'Maharashtra',
    coordinates: { x: 190, y: 380, lat: 19.2967, lng: 73.0631 },
    isBuyerHub: true,
    description: 'Major regional logistics and cold warehouse gateway.'
  },
  {
    id: 'NODE-THANE',
    name: 'Thane Gateway',
    hindiName: 'ठाणे गेटवे',
    state: 'Maharashtra',
    coordinates: { x: 160, y: 410, lat: 19.2183, lng: 72.9781 },
    isBuyerHub: true,
    description: 'Northern metropolitan distribution artery.'
  },
  {
    id: 'NODE-MUMBAI-APMC',
    name: 'Vashi Navi Mumbai APMC',
    hindiName: 'वाशी नवी मुंबई एपीएमसी',
    state: 'Maharashtra',
    coordinates: { x: 170, y: 460, lat: 19.0760, lng: 72.9991 },
    isBuyerHub: true,
    description: 'Premier wholesale terminal, export cold hub & distribution.'
  },
  {
    id: 'NODE-MUMBAI-CENTRAL',
    name: 'Mumbai Central Depot',
    hindiName: 'मुंबई सेंट्रल डेपो',
    state: 'Maharashtra',
    coordinates: { x: 130, y: 470, lat: 18.9690, lng: 72.8205 },
    isBuyerHub: true,
    description: 'Direct urban retail procurement silos and processing units.'
  },
  {
    id: 'NODE-PUNE',
    name: 'Pune Agro Processing Hub',
    hindiName: 'पुणे ऍग्रो प्रोसेसिंग हब',
    state: 'Maharashtra',
    coordinates: { x: 400, y: 390, lat: 18.5204, lng: 73.8567 },
    isBuyerHub: true,
    description: 'FMCG manufacturing and food processing cluster.'
  },
  {
    id: 'NODE-AHMEDNAGAR',
    name: 'Ahmednagar Granary Link',
    hindiName: 'अहमदनगर ग्रेनरी लिंक',
    state: 'Maharashtra',
    coordinates: { x: 460, y: 240, lat: 19.0948, lng: 74.7480 },
    isFarmingHub: true,
    description: 'Pulses, millets, and jaggery production corridor.'
  },
  {
    id: 'NODE-KALYAN',
    name: 'Kalyan East Terminal',
    hindiName: 'कल्याण पूर्व टर्मिनल',
    state: 'Maharashtra',
    coordinates: { x: 230, y: 410, lat: 19.2403, lng: 73.1305 },
    description: 'Alternative freight corridor bypassing core suburban congestion.'
  },
  {
    id: 'NODE-PANVEL',
    name: 'Panvel South Express Hub',
    hindiName: 'पनवेल दक्षिण एक्सप्रेस हब',
    state: 'Maharashtra',
    coordinates: { x: 210, y: 470, lat: 18.9894, lng: 73.1175 },
    isBuyerHub: true,
    description: 'JNPT Port corridor and Southern Expressway link.'
  }
];

// -------------------------------------------------------------
// 2. Road Network Edges (Bidirectional Roads)
// -------------------------------------------------------------
export const ROAD_EDGES: RoadEdge[] = [
  // Nashik Local Farm Links
  {
    from: 'NODE-PIMPALGAON',
    to: 'NODE-NASHIK',
    distanceKm: 32,
    baseDurationMinutes: 40,
    tollCost: 0,
    trafficLevel: 'Low',
    roadCondition: 'National Highway',
    highwayCode: 'NH-60'
  },
  {
    from: 'NODE-LASALGAON',
    to: 'NODE-NASHIK',
    distanceKm: 58,
    baseDurationMinutes: 65,
    tollCost: 45,
    trafficLevel: 'Low',
    roadCondition: 'State Highway',
    highwayCode: 'SH-30'
  },
  {
    from: 'NODE-LASALGAON',
    to: 'NODE-SINNAR',
    distanceKm: 64,
    baseDurationMinutes: 70,
    tollCost: 50,
    trafficLevel: 'Low',
    roadCondition: 'State Highway',
    highwayCode: 'SH-10'
  },
  {
    from: 'NODE-NASHIK',
    to: 'NODE-SINNAR',
    distanceKm: 30,
    baseDurationMinutes: 35,
    tollCost: 0,
    trafficLevel: 'Low',
    roadCondition: 'National Highway',
    highwayCode: 'NH-160'
  },

  // Primary Corridor: Nashik -> Igatpuri -> Kasara -> Shahapur -> Bhiwandi -> Mumbai
  {
    from: 'NODE-NASHIK',
    to: 'NODE-IGATPURI',
    distanceKm: 46,
    baseDurationMinutes: 45,
    tollCost: 85,
    trafficLevel: 'Low',
    roadCondition: 'Expressway',
    highwayCode: 'NH-160'
  },
  {
    from: 'NODE-SINNAR',
    to: 'NODE-IGATPURI',
    distanceKm: 48,
    baseDurationMinutes: 50,
    tollCost: 60,
    trafficLevel: 'Low',
    roadCondition: 'State Highway',
    highwayCode: 'SH-44'
  },
  {
    from: 'NODE-IGATPURI',
    to: 'NODE-KASARA',
    distanceKm: 28,
    baseDurationMinutes: 35,
    tollCost: 95,
    trafficLevel: 'Moderate',
    roadCondition: 'National Highway',
    highwayCode: 'NH-160 (Ghat)'
  },
  {
    from: 'NODE-KASARA',
    to: 'NODE-SHAHAPUR',
    distanceKm: 35,
    baseDurationMinutes: 35,
    tollCost: 0,
    trafficLevel: 'Low',
    roadCondition: 'National Highway',
    highwayCode: 'NH-160'
  },
  {
    from: 'NODE-SHAHAPUR',
    to: 'NODE-BHIWANDI',
    distanceKm: 42,
    baseDurationMinutes: 45,
    tollCost: 110,
    trafficLevel: 'Moderate',
    roadCondition: 'Expressway',
    highwayCode: 'NH-160'
  },
  {
    from: 'NODE-BHIWANDI',
    to: 'NODE-THANE',
    distanceKm: 18,
    baseDurationMinutes: 30,
    tollCost: 45,
    trafficLevel: 'Heavy',
    roadCondition: 'National Highway',
    highwayCode: 'NH-48'
  },
  {
    from: 'NODE-THANE',
    to: 'NODE-MUMBAI-APMC',
    distanceKm: 24,
    baseDurationMinutes: 35,
    tollCost: 45,
    trafficLevel: 'Moderate',
    roadCondition: 'National Highway',
    highwayCode: 'Thane-Belapur Rd'
  },
  {
    from: 'NODE-THANE',
    to: 'NODE-MUMBAI-CENTRAL',
    distanceKm: 34,
    baseDurationMinutes: 55,
    tollCost: 85,
    trafficLevel: 'Heavy',
    roadCondition: 'Expressway',
    highwayCode: 'EE Highway'
  },
  {
    from: 'NODE-MUMBAI-APMC',
    to: 'NODE-MUMBAI-CENTRAL',
    distanceKm: 22,
    baseDurationMinutes: 35,
    tollCost: 40,
    trafficLevel: 'Moderate',
    roadCondition: 'Expressway',
    highwayCode: 'Sion-Panvel Hwy'
  },

  // Alternative Corridor 1: Via Samruddhi Expressway feeder / Kalyan Bypass
  {
    from: 'NODE-SHAHAPUR',
    to: 'NODE-KALYAN',
    distanceKm: 36,
    baseDurationMinutes: 42,
    tollCost: 55,
    trafficLevel: 'Low',
    roadCondition: 'State Highway',
    highwayCode: 'SH-80'
  },
  {
    from: 'NODE-KALYAN',
    to: 'NODE-MUMBAI-APMC',
    distanceKm: 31,
    baseDurationMinutes: 45,
    tollCost: 40,
    trafficLevel: 'Moderate',
    roadCondition: 'State Highway',
    highwayCode: 'Kalyan-Shil Rd'
  },
  {
    from: 'NODE-KALYAN',
    to: 'NODE-PANVEL',
    distanceKm: 34,
    baseDurationMinutes: 40,
    tollCost: 50,
    trafficLevel: 'Low',
    roadCondition: 'National Highway',
    highwayCode: 'NH-48 Ext'
  },
  {
    from: 'NODE-PANVEL',
    to: 'NODE-MUMBAI-APMC',
    distanceKm: 19,
    baseDurationMinutes: 25,
    tollCost: 40,
    trafficLevel: 'Low',
    roadCondition: 'Expressway',
    highwayCode: 'Sion-Panvel Expy'
  },

  // Alternative Corridor 2: Pune & Ahmednagar Route (South-Eastern Corridor)
  {
    from: 'NODE-SINNAR',
    to: 'NODE-AHMEDNAGAR',
    distanceKm: 120,
    baseDurationMinutes: 130,
    tollCost: 140,
    trafficLevel: 'Low',
    roadCondition: 'State Highway',
    highwayCode: 'SH-10'
  },
  {
    from: 'NODE-AHMEDNAGAR',
    to: 'NODE-PUNE',
    distanceKm: 122,
    baseDurationMinutes: 140,
    tollCost: 160,
    trafficLevel: 'Moderate',
    roadCondition: 'National Highway',
    highwayCode: 'NH-753F'
  },
  {
    from: 'NODE-NASHIK',
    to: 'NODE-PUNE',
    distanceKm: 210,
    baseDurationMinutes: 240,
    tollCost: 220,
    trafficLevel: 'Moderate',
    roadCondition: 'National Highway',
    highwayCode: 'NH-60'
  },
  {
    from: 'NODE-PUNE',
    to: 'NODE-PANVEL',
    distanceKm: 118,
    baseDurationMinutes: 105,
    tollCost: 320,
    trafficLevel: 'Low',
    roadCondition: 'Expressway',
    highwayCode: 'Mumbai-Pune Expy'
  }
];

// Helper to make edges bidirectional in our adjacency list
function getAdjacencyList(): Map<string, { edge: RoadEdge; neighborId: string }[]> {
  const adj = new Map<string, { edge: RoadEdge; neighborId: string }[]>();
  for (const node of ROAD_NODES) {
    adj.set(node.id, []);
  }

  for (const edge of ROAD_EDGES) {
    adj.get(edge.from)?.push({ edge, neighborId: edge.to });
    adj.get(edge.to)?.push({
      edge: { ...edge, from: edge.to, to: edge.from },
      neighborId: edge.from
    });
  }

  return adj;
}

// -------------------------------------------------------------
// 3. Vehicles Fleet Catalog
// -------------------------------------------------------------
export const TRANSPORT_VEHICLES: TransportVehicle[] = [
  {
    id: 'VEH-TEMPO-1K',
    name: 'Tata Ace Gold (Tempo)',
    type: 'Tempo',
    capacityKg: 1000,
    baseCost: 1200,
    perKmRate: 14,
    availability: 'Available',
    rating: 4.9,
    tripsCompleted: 142,
    driverName: 'Suresh More',
    driverPhone: '+91 98221 44550',
    driverAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    vehicleNumber: 'MH-15-EG-4412',
    dimensions: '7.2 ft × 4.9 ft × 5.5 ft',
    features: ['Tarpaulin Rain Cover', 'GPS Real-time Tracker', 'Side Crate Railings']
  },
  {
    id: 'VEH-MINI-TRUCK-15K',
    name: 'Mahindra Bolero Maxi Truck (Mini Truck)',
    type: 'Mini Truck',
    capacityKg: 1500,
    baseCost: 1500,
    perKmRate: 17,
    availability: 'Available',
    rating: 4.8,
    tripsCompleted: 98,
    driverName: 'Balasaheb Shinde',
    driverPhone: '+91 97632 88910',
    driverAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    vehicleNumber: 'MH-15-BT-8901',
    dimensions: '8.5 ft × 5.6 ft × 6.0 ft',
    features: ['Heavy Leaf Suspension', 'Assay Weighment Sensor', 'FastTag Toll Auto-Pay']
  },
  {
    id: 'VEH-PICKUP-700',
    name: 'Mahindra Pickup Super',
    type: 'Pickup',
    capacityKg: 700,
    baseCost: 950,
    perKmRate: 12,
    availability: 'Available',
    rating: 4.7,
    tripsCompleted: 64,
    driverName: 'Ganesh Jadhav',
    driverPhone: '+91 94230 11988',
    driverAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    vehicleNumber: 'MH-15-CU-3320',
    dimensions: '6.5 ft × 4.5 ft × 4.5 ft',
    features: ['Quick Urban Agility', 'Crate Strapping System', 'Digital Invoicing']
  },
  {
    id: 'VEH-EV-CARGO-800',
    name: 'Switch IeV3 (EV Green Cargo)',
    type: 'EV Cargo',
    capacityKg: 800,
    baseCost: 1000,
    perKmRate: 11,
    availability: 'Available',
    rating: 4.95,
    tripsCompleted: 86,
    driverName: 'Nitin Sonawane',
    driverPhone: '+91 98901 77234',
    driverAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
    vehicleNumber: 'MH-15-EV-1008',
    isElectric: true,
    co2SavingsPercent: 78,
    dimensions: '7.0 ft × 4.8 ft × 5.2 ft',
    features: ['100% Zero Emissions', 'Low Vibration for Delicate Fruit', 'Eco-Priority Access']
  },
  {
    id: 'VEH-HEAVY-TRUCK-5K',
    name: 'Eicher Pro 2059 (Heavy Cargo)',
    type: 'Heavy Truck',
    capacityKg: 5000,
    baseCost: 2800,
    perKmRate: 28,
    availability: 'Available',
    rating: 4.9,
    tripsCompleted: 210,
    driverName: 'Vikram Rajput',
    driverPhone: '+91 98230 55123',
    driverAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
    vehicleNumber: 'MH-15-AA-7744',
    dimensions: '14.0 ft × 7.0 ft × 7.5 ft',
    features: ['High Volume Bulk Container', 'Dual Driver for Long Haul', 'Electronic Seal Lock']
  }
];

// -------------------------------------------------------------
// 4. Default A* Cost Weights
// -------------------------------------------------------------
export const DEFAULT_ASTAR_WEIGHTS: AStarCostWeights = {
  distanceWeight: 1.0,   // ₹1.0 per km normalized
  timeWeight: 1.4,       // ₹1.4 per min of travel time
  trafficMultiplier: {
    Low: 1.0,
    Moderate: 1.35,
    Heavy: 1.85
  },
  tollWeight: 0.8        // ₹0.8 per toll ₹ (balanced against speed)
};

// -------------------------------------------------------------
// 5. Euclidean Distance Heuristic h(n)
// -------------------------------------------------------------
function calculateHeuristic(nodeA: RoadNode, nodeB: RoadNode): number {
  // Approximate straight-line distance using coordinate scale
  const dx = nodeA.coordinates.x - nodeB.coordinates.x;
  const dy = nodeA.coordinates.y - nodeB.coordinates.y;
  const pixelDist = Math.sqrt(dx * dx + dy * dy);
  
  // Scale factor: approx 0.8 km per coordinate unit in our SVG projection
  const approxKm = pixelDist * 0.8;
  
  // Admissible heuristic: minimum travel cost rate per km (~₹1.1/km)
  // Ensures h(n) <= true cost to goal, guaranteeing mathematical optimality
  return approxKm * 1.1;
}

// -------------------------------------------------------------
// 6. Calculate Edge Cost g(current, neighbor)
// -------------------------------------------------------------
export function calculateEdgeCost(edge: RoadEdge, weights: AStarCostWeights = DEFAULT_ASTAR_WEIGHTS): {
  totalCost: number;
  breakdown: { distanceCost: number; travelTimeCost: number; trafficPenaltyCost: number; tollCost: number };
} {
  const trafficMult = weights.trafficMultiplier[edge.trafficLevel] || 1.0;
  
  const distanceCost = edge.distanceKm * weights.distanceWeight;
  const effectiveTimeMinutes = edge.baseDurationMinutes * trafficMult;
  const travelTimeCost = effectiveTimeMinutes * weights.timeWeight;
  const trafficPenaltyCost = (trafficMult - 1.0) * edge.baseDurationMinutes * weights.timeWeight;
  const tollCost = edge.tollCost * weights.tollWeight;

  const totalCost = distanceCost + travelTimeCost + tollCost;

  return {
    totalCost,
    breakdown: {
      distanceCost,
      travelTimeCost,
      trafficPenaltyCost,
      tollCost: edge.tollCost // raw rupee amount for display
    }
  };
}

// -------------------------------------------------------------
// 7. Core A* Search Algorithm
// -------------------------------------------------------------
export function runAStarAlgorithm(
  startNodeId: string,
  goalNodeId: string,
  weights: AStarCostWeights = DEFAULT_ASTAR_WEIGHTS,
  excludedEdgeCodes: string[] = []
): {
  pathNodeIds: string[];
  edgesTraversed: RoadEdge[];
  stepLogs: AStarStepLog[];
  totalScore: number;
} | null {
  const nodesMap = new Map<string, RoadNode>(ROAD_NODES.map(n => [n.id, n]));
  const startNode = nodesMap.get(startNodeId);
  const goalNode = nodesMap.get(goalNodeId);

  if (!startNode || !goalNode) return null;

  const adjacency = getAdjacencyList();

  // Set of discovered nodes that need evaluation
  const openSet = new Set<string>([startNodeId]);
  
  // Set of evaluated nodes
  const closedSet = new Set<string>();

  // cameFrom[nodeId] = { parentId, edge }
  const cameFrom = new Map<string, { parentId: string; edge: RoadEdge }>();

  // gScore[nodeId] = cost of cheapest path from start to nodeId currently known
  const gScore = new Map<string, number>();
  gScore.set(startNodeId, 0);

  // fScore[nodeId] = gScore[nodeId] + h(nodeId, goal)
  const fScore = new Map<string, number>();
  fScore.set(startNodeId, calculateHeuristic(startNode, goalNode));

  const stepLogs: AStarStepLog[] = [];

  while (openSet.size > 0) {
    // Current is the node in openSet having the lowest fScore[] value
    let currentId = '';
    let lowestF = Infinity;

    for (const nodeId of openSet) {
      const f = fScore.get(nodeId) ?? Infinity;
      if (f < lowestF) {
        lowestF = f;
        currentId = nodeId;
      }
    }

    const currentNode = nodesMap.get(currentId)!;
    const currentG = gScore.get(currentId) || 0;
    const currentH = calculateHeuristic(currentNode, goalNode);

    stepLogs.push({
      nodeId: currentId,
      nodeName: currentNode.name,
      gScore: Math.round(currentG),
      hScore: Math.round(currentH),
      fScore: Math.round(lowestF),
      parentName: cameFrom.get(currentId) ? nodesMap.get(cameFrom.get(currentId)!.parentId)?.name : 'Origin'
    });

    // Reached Goal!
    if (currentId === goalNodeId) {
      // Reconstruct Path
      const pathNodeIds: string[] = [goalNodeId];
      const edgesTraversed: RoadEdge[] = [];

      let curr = goalNodeId;
      while (cameFrom.has(curr)) {
        const step = cameFrom.get(curr)!;
        edgesTraversed.unshift(step.edge);
        pathNodeIds.unshift(step.parentId);
        curr = step.parentId;
      }

      return {
        pathNodeIds,
        edgesTraversed,
        stepLogs,
        totalScore: lowestF
      };
    }

    openSet.delete(currentId);
    closedSet.add(currentId);

    const neighbors = adjacency.get(currentId) || [];

    for (const { edge, neighborId } of neighbors) {
      if (closedSet.has(neighborId)) continue;

      // Skip excluded edges (useful for computing alternative routes)
      if (edge.highwayCode && excludedEdgeCodes.includes(edge.highwayCode)) {
        continue;
      }

      const neighborNode = nodesMap.get(neighborId);
      if (!neighborNode) continue;

      const { totalCost: edgeTraversalCost } = calculateEdgeCost(edge, weights);
      const tentativeGScore = currentG + edgeTraversalCost;

      const currentNeighborG = gScore.get(neighborId) ?? Infinity;

      if (tentativeGScore < currentNeighborG) {
        cameFrom.set(neighborId, { parentId: currentId, edge });
        gScore.set(neighborId, tentativeGScore);
        const neighborH = calculateHeuristic(neighborNode, goalNode);
        const neighborF = tentativeGScore + neighborH;
        fScore.set(neighborId, neighborF);

        if (!openSet.has(neighborId)) {
          openSet.add(neighborId);
        }
      }
    }
  }

  // No path found
  return null;
}

// -------------------------------------------------------------
// 8. Generate Optimal Route + Alternative Comparison Routes
// -------------------------------------------------------------
export function calculateOptimizedRoutes(
  startNodeId: string = 'NODE-NASHIK',
  goalNodeId: string = 'NODE-MUMBAI-APMC',
  weights: AStarCostWeights = DEFAULT_ASTAR_WEIGHTS
): RouteOptimizationResult[] {
  const nodesMap = new Map<string, RoadNode>(ROAD_NODES.map(n => [n.id, n]));

  // 1. Primary Optimal Route (Standard A*)
  const primaryResult = runAStarAlgorithm(startNodeId, goalNodeId, weights);
  if (!primaryResult) return [];

  const createRouteObject = (
    id: string,
    name: string,
    tag: string,
    description: string,
    isRecommended: boolean,
    result: NonNullable<typeof primaryResult>
  ): RouteOptimizationResult => {
    let totalDist = 0;
    let totalMins = 0;
    let totalTolls = 0;
    let distCost = 0;
    let timeCost = 0;
    let trafficCost = 0;
    let hasHeavy = false;
    let hasMod = false;

    for (const edge of result.edgesTraversed) {
      totalDist += edge.distanceKm;
      const trafficMult = weights.trafficMultiplier[edge.trafficLevel] || 1.0;
      const effectiveDuration = edge.baseDurationMinutes * trafficMult;
      totalMins += effectiveDuration;
      totalTolls += edge.tollCost;

      const { breakdown } = calculateEdgeCost(edge, weights);
      distCost += breakdown.distanceCost;
      timeCost += breakdown.travelTimeCost;
      trafficCost += breakdown.trafficPenaltyCost;

      if (edge.trafficLevel === 'Heavy') hasHeavy = true;
      else if (edge.trafficLevel === 'Moderate') hasMod = true;
    }

    const overallTraffic: TrafficLevel = hasHeavy ? 'Heavy' : hasMod ? 'Moderate' : 'Low';
    const pathNodes = result.pathNodeIds.map(id => nodesMap.get(id)!).filter(Boolean);

    // Highway summary string (e.g. "NH-160 via Igatpuri → Kasara")
    const highwayCodes = Array.from(new Set(result.edgesTraversed.map(e => e.highwayCode).filter(Boolean)));
    const highwaySummary = highwayCodes.length > 0 ? highwayCodes.join(' ➔ ') : 'Direct Highway Corridor';

    // Standard transport cost estimate for base vehicle (₹14/km + base fee)
    const baseVehicleRate = 14;
    const baseVehicleFee = 1200;
    const totalCostEstimate = Math.round(baseVehicleFee + (totalDist * baseVehicleRate) + totalTolls);

    return {
      id,
      name,
      highwaySummary,
      pathNodeIds: result.pathNodeIds,
      pathNodes,
      edges: result.edgesTraversed,
      totalDistanceKm: totalDist,
      totalDurationMinutes: Math.round(totalMins),
      totalTollCost: totalTolls,
      overallTraffic,
      totalCostEstimate,
      weightedScore: Math.round(result.totalScore),
      costBreakdown: {
        distanceCost: Math.round(distCost * 10),
        travelTimeCost: Math.round(timeCost * 8),
        trafficPenaltyCost: Math.round(trafficCost * 6),
        tollCost: totalTolls
      },
      isRecommended,
      tag,
      description,
      aStarLogs: result.stepLogs
    };
  };

  const routes: RouteOptimizationResult[] = [];

  // 1. Recommended Route (Lowest f(n) cost)
  routes.push(
    createRouteObject(
      'ROUTE-OPTIMAL-A-STAR',
      `${nodesMap.get(startNodeId)?.name.split(' ')[0]} ➔ Igatpuri ➔ ${nodesMap.get(goalNodeId)?.name.split(' ')[0]}`,
      '🟢 Recommended (Direct Optimal)',
      'Direct farm-to-buyer highway. Lowest weighted cost with optimized transit speed & minimum toll penalty.',
      true,
      primaryResult
    )
  );

  // 2. Alternative Route 1: Via Eastern bypass / Kalyan Corridor
  const alternative1 = runAStarAlgorithm(startNodeId, goalNodeId, weights, ['NH-48']);
  if (alternative1 && alternative1.pathNodeIds.join() !== primaryResult.pathNodeIds.join()) {
    routes.push(
      createRouteObject(
        'ROUTE-ALT-KALYAN-BYPASS',
        `${nodesMap.get(startNodeId)?.name.split(' ')[0]} ➔ Shahapur ➔ Kalyan ➔ ${nodesMap.get(goalNodeId)?.name.split(' ')[0]}`,
        '⚡ Freight Bypass Route',
        'Bypasses core Thane traffic via Kalyan-Shil link road. Moderate tolls and steady cruising speed.',
        false,
        alternative1
      )
    );
  }

  // 3. Alternative Route 2: Via Pune Expressway Southern Corridor
  const alternative2 = runAStarAlgorithm(startNodeId, goalNodeId, {
    ...weights,
    distanceWeight: 0.7,
    timeWeight: 2.0 // Heavy time penalty forces expressway
  }, ['NH-160 (Ghat)']);

  if (alternative2 && alternative2.pathNodeIds.join() !== primaryResult.pathNodeIds.join() && (!routes[1] || alternative2.pathNodeIds.join() !== routes[1].pathNodeIds.join())) {
    routes.push(
      createRouteObject(
        'ROUTE-ALT-EXPRESSWAY',
        `${nodesMap.get(startNodeId)?.name.split(' ')[0]} ➔ Pune Expressway ➔ ${nodesMap.get(goalNodeId)?.name.split(' ')[0]}`,
        '🛣️ Southern Expressway',
        'Longer distance but uses 6-lane access-controlled expressways. Higher tolls with high speed consistency.',
        false,
        alternative2
      )
    );
  }

  // If no diverse alternative was found by graph search, provide a simulated alternate
  if (routes.length === 1) {
    const r = routes[0];
    routes.push({
      ...r,
      id: 'ROUTE-ALT-SIMULATED',
      name: `${nodesMap.get(startNodeId)?.name.split(' ')[0]} ➔ Ghoti Bypass ➔ ${nodesMap.get(goalNodeId)?.name.split(' ')[0]}`,
      tag: '🔵 Alternative Toll-Free',
      description: 'Secondary state highway route avoiding major toll plazas with slightly higher travel time.',
      totalDistanceKm: Math.round(r.totalDistanceKm * 1.08),
      totalDurationMinutes: Math.round(r.totalDurationMinutes * 1.15),
      totalTollCost: Math.max(0, r.totalTollCost - 120),
      totalCostEstimate: Math.round(r.totalCostEstimate * 1.06),
      isRecommended: false,
      overallTraffic: 'Moderate'
    });
  }

  return routes;
}

// -------------------------------------------------------------
// 9. Vehicle Matching & Pricing Engine
// -------------------------------------------------------------
export function matchVehiclesForPayload(
  orderWeightKg: number,
  routeDistanceKm: number
): {
  vehicles: TransportVehicle[];
  recommendedVehicle: TransportVehicle;
  calculatedCosts: Map<string, number>;
} {
  const calculatedCosts = new Map<string, number>();

  const evaluatedVehicles = TRANSPORT_VEHICLES.map(vehicle => {
    // Calculate total trip cost = baseCost + (perKmRate * km)
    const tripCost = Math.round(vehicle.baseCost + (vehicle.perKmRate * routeDistanceKm));
    calculatedCosts.set(vehicle.id, tripCost);

    let availability: TransportVehicle['availability'] = vehicle.availability;
    if (orderWeightKg > vehicle.capacityKg) {
      availability = 'Insufficient capacity';
    }

    return {
      ...vehicle,
      availability
    };
  });

  // Find eligible vehicles that have sufficient capacity
  const eligible = evaluatedVehicles.filter(v => v.capacityKg >= orderWeightKg);

  // Pick recommended vehicle: lowest cost among eligible vehicles
  let recommendedVehicle = evaluatedVehicles[0];
  if (eligible.length > 0) {
    eligible.sort((a, b) => {
      const costA = calculatedCosts.get(a.id) || 0;
      const costB = calculatedCosts.get(b.id) || 0;
      return costA - costB;
    });
    recommendedVehicle = eligible[0];
  } else {
    // If order exceeds all, recommend heaviest
    recommendedVehicle = evaluatedVehicles.reduce((prev, curr) => curr.capacityKg > prev.capacityKg ? curr : prev);
  }

  return {
    vehicles: evaluatedVehicles,
    recommendedVehicle,
    calculatedCosts
  };
}

// Format duration helper (e.g. 255 mins -> "4 hr 15 min")
export function formatDurationHoursMins(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins} min`;
  if (mins === 0) return `${hrs} hr`;
  return `${hrs} hr ${mins} min`;
}
