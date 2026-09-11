export interface CropVariety {
  id: string;
  name: string;
  defaultGrade?: string;
  benchmarkPrice?: number;
  description?: string;
}

export interface CropItem {
  id: string;
  name: string;
  category: 'Vegetables' | 'Grains' | 'Pulses' | 'Oilseeds' | 'Spices' | 'Cash Crops';
  image: string;
  fallbackImage: string;
  defaultVariety: string;
  defaultPrice: number;
  varieties: CropVariety[];
  isActive: boolean;
}

/**
 * Single Source of Truth: Central Crop Master for Fieldora 2.0
 * Flat list of 15 standard agricultural commodities with realistic crop photography.
 */
export const CROP_MASTER: CropItem[] = [
  {
    id: 'crop-onion',
    name: 'Onion',
    category: 'Vegetables',
    image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=800&q=80',
    fallbackImage: '/images/crops/onion.jpg',
    defaultVariety: 'Nashik Garwa',
    defaultPrice: 2400,
    isActive: true,
    varieties: [
      { id: 'on-1', name: 'Nashik Garwa', benchmarkPrice: 2400 },
      { id: 'on-2', name: 'Bhima Super Red', benchmarkPrice: 2450 },
      { id: 'on-3', name: 'Agrifound Dark Red', benchmarkPrice: 2350 },
      { id: 'on-4', name: 'Pusa White Round', benchmarkPrice: 2500 }
    ]
  },
  {
    id: 'crop-potato',
    name: 'Potato',
    category: 'Vegetables',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80',
    fallbackImage: '/images/crops/potato.jpg',
    defaultVariety: 'Kufri Jyoti',
    defaultPrice: 2100,
    isActive: true,
    varieties: [
      { id: 'pot-1', name: 'Kufri Jyoti', benchmarkPrice: 2100 },
      { id: 'pot-2', name: 'Kufri Pukhraj', benchmarkPrice: 2050 },
      { id: 'pot-3', name: 'Kufri Chipsona (Processing)', benchmarkPrice: 2250 },
      { id: 'pot-4', name: 'Lady Rosetta', benchmarkPrice: 2300 }
    ]
  },
  {
    id: 'crop-tomato',
    name: 'Tomato',
    category: 'Vegetables',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
    fallbackImage: '/images/crops/tomato.jpg',
    defaultVariety: 'Abhinav Hybrid Grade A',
    defaultPrice: 2800,
    isActive: true,
    varieties: [
      { id: 'tom-1', name: 'Abhinav Hybrid Grade A', benchmarkPrice: 2800 },
      { id: 'tom-2', name: 'US 440 Hybrid', benchmarkPrice: 2750 },
      { id: 'tom-3', name: 'Himsona Table', benchmarkPrice: 2900 },
      { id: 'tom-4', name: 'Roma Processing', benchmarkPrice: 2600 }
    ]
  },
  {
    id: 'crop-capsicum',
    name: 'Capsicum',
    category: 'Vegetables',
    image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=800&q=80',
    fallbackImage: '/images/crops/capsicum.jpg',
    defaultVariety: 'Green Blocky Hybrid',
    defaultPrice: 3200,
    isActive: true,
    varieties: [
      { id: 'cap-1', name: 'Green Blocky Hybrid', benchmarkPrice: 3200 },
      { id: 'cap-2', name: 'Indra F1 Green', benchmarkPrice: 3300 },
      { id: 'cap-3', name: 'Yellow Bell Hybrid', benchmarkPrice: 5500 },
      { id: 'cap-4', name: 'Red Bell Hybrid', benchmarkPrice: 5800 }
    ]
  },
  {
    id: 'crop-green-chilli',
    name: 'Green Chilli',
    category: 'Vegetables',
    image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=800&q=80',
    fallbackImage: '/images/crops/green-chilli.jpg',
    defaultVariety: 'Jwala Spicy Green',
    defaultPrice: 3800,
    isActive: true,
    varieties: [
      { id: 'gc-1', name: 'Jwala Spicy Green', benchmarkPrice: 3800 },
      { id: 'gc-2', name: 'Lavangi Hot', benchmarkPrice: 4200 },
      { id: 'gc-3', name: 'G-4 Hybrid', benchmarkPrice: 3600 },
      { id: 'gc-4', name: 'Teja Export Green', benchmarkPrice: 4500 }
    ]
  },
  {
    id: 'crop-ginger',
    name: 'Ginger',
    category: 'Spices',
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
    fallbackImage: '/images/crops/ginger.jpg',
    defaultVariety: 'Satara Fresh Washed',
    defaultPrice: 9500,
    isActive: true,
    varieties: [
      { id: 'gin-1', name: 'Satara Fresh Washed', benchmarkPrice: 9500 },
      { id: 'gin-2', name: 'Maran Organic', benchmarkPrice: 10200 },
      { id: 'gin-3', name: 'Rio-de-Janeiro', benchmarkPrice: 9800 },
      { id: 'gin-4', name: 'Wayanad Bold', benchmarkPrice: 11000 }
    ]
  },
  {
    id: 'crop-garlic',
    name: 'Garlic',
    category: 'Spices',
    image: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&w=800&q=80',
    fallbackImage: '/images/crops/garlic.jpg',
    defaultVariety: 'Yamuna Safed (G-1)',
    defaultPrice: 12000,
    isActive: true,
    varieties: [
      { id: 'gar-1', name: 'Yamuna Safed (G-1)', benchmarkPrice: 12000 },
      { id: 'gar-2', name: 'Agrifound White (G-41)', benchmarkPrice: 12500 },
      { id: 'gar-3', name: 'Ooty Garlic Bold', benchmarkPrice: 14000 },
      { id: 'gar-4', name: 'Desi White Regular', benchmarkPrice: 11500 }
    ]
  },
  {
    id: 'crop-lemon',
    name: 'Lemon',
    category: 'Vegetables',
    image: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=800&q=80',
    fallbackImage: '/images/crops/lemon.jpg',
    defaultVariety: 'Kagzi Juicy Lime',
    defaultPrice: 5000,
    isActive: true,
    varieties: [
      { id: 'lem-1', name: 'Kagzi Juicy Lime', benchmarkPrice: 5000 },
      { id: 'lem-2', name: 'Vikram High-Yield', benchmarkPrice: 4800 },
      { id: 'lem-3', name: 'Balaji Seedless', benchmarkPrice: 5400 },
      { id: 'lem-4', name: 'Sai Sharbati', benchmarkPrice: 5200 }
    ]
  },
  {
    id: 'crop-carrot',
    name: 'Carrot',
    category: 'Vegetables',
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=800&q=80',
    fallbackImage: '/images/crops/carrot.jpg',
    defaultVariety: 'Pusa Kesar Orange-Red',
    defaultPrice: 2200,
    isActive: true,
    varieties: [
      { id: 'car-1', name: 'Pusa Kesar Orange-Red', benchmarkPrice: 2200 },
      { id: 'car-2', name: 'Kuroda Select', benchmarkPrice: 2400 },
      { id: 'car-3', name: 'Nantes French Table', benchmarkPrice: 2600 },
      { id: 'car-4', name: 'Super Red Hybrid', benchmarkPrice: 2300 }
    ]
  },
  {
    id: 'crop-rice-paddy',
    name: 'Rice / Paddy',
    category: 'Grains',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80',
    fallbackImage: '/images/crops/rice-paddy.jpg',
    defaultVariety: 'Basmati 1121 Traditional',
    defaultPrice: 4200,
    isActive: true,
    varieties: [
      { id: 'rp-1', name: 'Basmati 1121 Traditional', benchmarkPrice: 4200 },
      { id: 'rp-2', name: 'Pusa 1509 Basmati', benchmarkPrice: 3900 },
      { id: 'rp-3', name: 'Sona Masoori Raw', benchmarkPrice: 3600 },
      { id: 'rp-4', name: 'IR-64 Raw Paddy', benchmarkPrice: 2350 }
    ]
  },
  {
    id: 'crop-wheat',
    name: 'Wheat',
    category: 'Grains',
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80',
    fallbackImage: '/images/crops/wheat.jpg',
    defaultVariety: 'Sharbati Gold',
    defaultPrice: 2750,
    isActive: true,
    varieties: [
      { id: 'wh-1', name: 'Sharbati Gold', benchmarkPrice: 2750 },
      { id: 'wh-2', name: 'Lokwan Premium Grain', benchmarkPrice: 2650 },
      { id: 'wh-3', name: 'PBW-502 Milling Grade', benchmarkPrice: 2500 },
      { id: 'wh-4', name: 'GW-496 Sharbati', benchmarkPrice: 2700 }
    ]
  },
  {
    id: 'crop-jowar',
    name: 'Jowar',
    category: 'Grains',
    image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=800&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=800&q=80',
    defaultVariety: 'Maldandi M-35-1 (White)',
    defaultPrice: 3400,
    isActive: true,
    varieties: [
      { id: 'jow-1', name: 'Maldandi M-35-1 (White)', benchmarkPrice: 3400 },
      { id: 'jow-2', name: 'CSH-14 Sorghum Grain', benchmarkPrice: 3100 },
      { id: 'jow-3', name: 'Phule Suchitra', benchmarkPrice: 3500 },
      { id: 'jow-4', name: 'Gundari White Local', benchmarkPrice: 3200 }
    ]
  },
  {
    id: 'crop-bajra',
    name: 'Bajra',
    category: 'Grains',
    image: 'https://images.unsplash.com/photo-1607672632458-9eb56696346b?auto=format&fit=crop&w=800&q=80',
    fallbackImage: '/images/crops/bajra.jpg',
    defaultVariety: 'Desi Pearl Millet (Bold)',
    defaultPrice: 2450,
    isActive: true,
    varieties: [
      { id: 'baj-1', name: 'Desi Pearl Millet (Bold)', benchmarkPrice: 2450 },
      { id: 'baj-2', name: 'HHB-67 Improved', benchmarkPrice: 2350 },
      { id: 'baj-3', name: 'ProAgro 9444 Hybrid', benchmarkPrice: 2500 },
      { id: 'baj-4', name: 'Shraddha F1 Hybrid', benchmarkPrice: 2400 }
    ]
  },
  {
    id: 'crop-masoor',
    name: 'Masoor',
    category: 'Pulses',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80',
    fallbackImage: '/images/crops/masoor.jpg',
    defaultVariety: 'Small Bold Brown Masoor',
    defaultPrice: 6800,
    isActive: true,
    varieties: [
      { id: 'mas-1', name: 'Small Bold Brown Masoor', benchmarkPrice: 6800 },
      { id: 'mas-2', name: 'Pusa Ageti Lentil', benchmarkPrice: 6900 },
      { id: 'mas-3', name: 'IPL-81 Malika', benchmarkPrice: 7100 },
      { id: 'mas-4', name: 'Red Split Grade A', benchmarkPrice: 7400 }
    ]
  },
  {
    id: 'crop-soybean',
    name: 'Soybean',
    category: 'Oilseeds',
    image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=800&q=80',
    fallbackImage: '/images/crops/soybean.jpg',
    defaultVariety: 'JS-335 Yellow Bold',
    defaultPrice: 4700,
    isActive: true,
    varieties: [
      { id: 'soy-1', name: 'JS-335 Yellow Bold', benchmarkPrice: 4700 },
      { id: 'soy-2', name: 'JS-9560 High Oil', benchmarkPrice: 4850 },
      { id: 'soy-3', name: 'NRC-37 (Ahilya)', benchmarkPrice: 4650 },
      { id: 'soy-4', name: 'RVS-2001-4', benchmarkPrice: 4750 }
    ]
  }
];

/**
 * Returns the active crop master list
 */
export function getCropMaster(): CropItem[] {
  return CROP_MASTER.filter(c => c.isActive);
}

/**
 * Returns a flat dropdown options list of { value, label } for all 15 crops
 */
export function getCropOptions(): { value: string; label: string }[] {
  return getCropMaster().map(c => ({
    value: c.name,
    label: c.name
  }));
}

/**
 * Finds a crop by name or alias (case-insensitive)
 */
export function getCropByName(name?: string): CropItem | undefined {
  if (!name) return undefined;
  const clean = name.trim().toLowerCase();
  
  return CROP_MASTER.find(c => {
    const cName = c.name.toLowerCase();
    if (cName === clean) return true;
    if (clean === 'rice' || clean === 'paddy' || clean === 'basmati') return c.name === 'Rice / Paddy';
    if (clean === 'soya' || clean === 'soyabean') return c.name === 'Soybean';
    if (clean === 'chilli' || clean === 'chili' || clean === 'mirchi') return c.name === 'Green Chilli';
    if (clean === 'bell pepper') return c.name === 'Capsicum';
    if (clean.includes(cName) || cName.includes(clean)) return true;
    return false;
  });
}

/**
 * Resolves the real photographic image URL for any given crop name.
 * Always resolves to a real agricultural harvest photograph.
 */
export function getCropImage(cropName?: string, existingUrl?: string): string {
  if (existingUrl && existingUrl.startsWith('http') && !existingUrl.includes('placeholder')) {
    return existingUrl;
  }
  
  const matched = getCropByName(cropName);
  if (matched) {
    return matched.image;
  }

  return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80';
}

/**
 * Returns the default variety for a crop
 */
export function getCropDefaultVariety(cropName?: string): string {
  const matched = getCropByName(cropName);
  return matched?.defaultVariety || 'Standard Hybrid Grade A';
}

/**
 * Returns the default benchmark price for a crop
 */
export function getCropDefaultPrice(cropName?: string): number {
  const matched = getCropByName(cropName);
  return matched?.defaultPrice || 2500;
}

/**
 * Returns category for a crop
 */
export function getCropCategory(cropName?: string): 'Vegetables' | 'Grains' | 'Pulses' | 'Oilseeds' | 'Spices' | 'Cash Crops' {
  const matched = getCropByName(cropName);
  return matched?.category || 'Vegetables';
}
