// Finishes library with categories for selection tool
import { supabase } from '@/integrations/supabase/client';

export interface FinishItem {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
  colorHex?: string;
  description?: string;
  isCustom?: boolean;
}

export const FINISH_CATEGORIES = [
  'All',
  'My Finishes',
  'Paint Colors',
  'Wood Finishes',
  'Laminates',
  'Fabrics',
  'Stone Textures',
  'Metal Finishes',
  'Wallpapers'
] as const;

export type FinishCategory = typeof FINISH_CATEGORIES[number];

// Default finishes library
export const DEFAULT_FINISHES: FinishItem[] = [
  // Paint Colors
  { id: 'paint-white', name: 'Pure White', category: 'Paint Colors', colorHex: '#FFFFFF' },
  { id: 'paint-off-white', name: 'Off White', category: 'Paint Colors', colorHex: '#FAF9F6' },
  { id: 'paint-ivory', name: 'Ivory', category: 'Paint Colors', colorHex: '#FFFFF0' },
  { id: 'paint-cream', name: 'Cream', category: 'Paint Colors', colorHex: '#FFFDD0' },
  { id: 'paint-beige', name: 'Beige', category: 'Paint Colors', colorHex: '#F5F5DC' },
  { id: 'paint-taupe', name: 'Taupe', category: 'Paint Colors', colorHex: '#483C32' },
  { id: 'paint-gray', name: 'Light Gray', category: 'Paint Colors', colorHex: '#D3D3D3' },
  { id: 'paint-charcoal', name: 'Charcoal', category: 'Paint Colors', colorHex: '#36454F' },
  { id: 'paint-navy', name: 'Navy Blue', category: 'Paint Colors', colorHex: '#000080' },
  { id: 'paint-sage', name: 'Sage Green', category: 'Paint Colors', colorHex: '#9DC183' },
  { id: 'paint-olive', name: 'Olive Green', category: 'Paint Colors', colorHex: '#808000' },
  { id: 'paint-terracotta', name: 'Terracotta', category: 'Paint Colors', colorHex: '#E2725B' },
  { id: 'paint-blush', name: 'Blush Pink', category: 'Paint Colors', colorHex: '#DE5D83' },
  { id: 'paint-burgundy', name: 'Burgundy', category: 'Paint Colors', colorHex: '#800020' },
  { id: 'paint-mustard', name: 'Mustard Yellow', category: 'Paint Colors', colorHex: '#FFDB58' },
  { id: 'paint-black', name: 'Matte Black', category: 'Paint Colors', colorHex: '#28282B' },

  // Wood Finishes
  { id: 'wood-oak-natural', name: 'Natural Oak', category: 'Wood Finishes', colorHex: '#C4A35A' },
  { id: 'wood-oak-white', name: 'White Oak', category: 'Wood Finishes', colorHex: '#E8DCC4' },
  { id: 'wood-walnut', name: 'Walnut', category: 'Wood Finishes', colorHex: '#5C4033' },
  { id: 'wood-mahogany', name: 'Mahogany', category: 'Wood Finishes', colorHex: '#C04000' },
  { id: 'wood-cherry', name: 'Cherry Wood', category: 'Wood Finishes', colorHex: '#990000' },
  { id: 'wood-teak', name: 'Teak', category: 'Wood Finishes', colorHex: '#B87333' },
  { id: 'wood-pine', name: 'Pine', category: 'Wood Finishes', colorHex: '#E5C07B' },
  { id: 'wood-ebony', name: 'Ebony', category: 'Wood Finishes', colorHex: '#3B3B3B' },
  { id: 'wood-ash', name: 'Ash Wood', category: 'Wood Finishes', colorHex: '#D4C9B0' },
  { id: 'wood-bamboo', name: 'Bamboo', category: 'Wood Finishes', colorHex: '#E3D9C6' },
  { id: 'wood-driftwood', name: 'Driftwood Gray', category: 'Wood Finishes', colorHex: '#A89F91' },
  { id: 'wood-reclaimed', name: 'Reclaimed Wood', category: 'Wood Finishes', colorHex: '#8B7355' },

  // Laminates
  { id: 'lam-white-gloss', name: 'White Gloss', category: 'Laminates', colorHex: '#FFFFFF' },
  { id: 'lam-white-matte', name: 'White Matte', category: 'Laminates', colorHex: '#F5F5F5' },
  { id: 'lam-black-gloss', name: 'Black Gloss', category: 'Laminates', colorHex: '#0D0D0D' },
  { id: 'lam-concrete', name: 'Concrete Effect', category: 'Laminates', colorHex: '#9B9B9B' },
  { id: 'lam-marble-white', name: 'White Marble', category: 'Laminates', colorHex: '#F2F0EB' },
  { id: 'lam-marble-black', name: 'Black Marble', category: 'Laminates', colorHex: '#2B2B2B' },
  { id: 'lam-wood-grain', name: 'Wood Grain', category: 'Laminates', colorHex: '#DEB887' },

  // Fabrics
  { id: 'fab-linen-white', name: 'White Linen', category: 'Fabrics', colorHex: '#FAF0E6' },
  { id: 'fab-linen-beige', name: 'Beige Linen', category: 'Fabrics', colorHex: '#E8DCC8' },
  { id: 'fab-velvet-blue', name: 'Blue Velvet', category: 'Fabrics', colorHex: '#1E3A5F' },
  { id: 'fab-velvet-green', name: 'Green Velvet', category: 'Fabrics', colorHex: '#2E5A4C' },
  { id: 'fab-velvet-burgundy', name: 'Burgundy Velvet', category: 'Fabrics', colorHex: '#722F37' },
  { id: 'fab-leather-tan', name: 'Tan Leather', category: 'Fabrics', colorHex: '#D2B48C' },
  { id: 'fab-leather-black', name: 'Black Leather', category: 'Fabrics', colorHex: '#1C1C1C' },
  { id: 'fab-leather-cognac', name: 'Cognac Leather', category: 'Fabrics', colorHex: '#9A463D' },
  { id: 'fab-boucle-white', name: 'White Bouclé', category: 'Fabrics', colorHex: '#F8F8F8' },
  { id: 'fab-cotton-gray', name: 'Gray Cotton', category: 'Fabrics', colorHex: '#A0A0A0' },

  // Stone Textures
  { id: 'stone-carrara', name: 'Carrara Marble', category: 'Stone Textures', colorHex: '#F2F0EB' },
  { id: 'stone-calacatta', name: 'Calacatta Gold', category: 'Stone Textures', colorHex: '#F5F3EE' },
  { id: 'stone-granite-black', name: 'Black Granite', category: 'Stone Textures', colorHex: '#1E1E1E' },
  { id: 'stone-granite-gray', name: 'Gray Granite', category: 'Stone Textures', colorHex: '#676767' },
  { id: 'stone-travertine', name: 'Travertine', category: 'Stone Textures', colorHex: '#E2D8C8' },
  { id: 'stone-slate', name: 'Slate', category: 'Stone Textures', colorHex: '#2F4F4F' },
  { id: 'stone-quartz-white', name: 'White Quartz', category: 'Stone Textures', colorHex: '#F9F9F9' },
  { id: 'stone-terrazzo', name: 'Terrazzo', category: 'Stone Textures', colorHex: '#E5E0D8' },
  { id: 'stone-sandstone', name: 'Sandstone', category: 'Stone Textures', colorHex: '#D4B896' },

  // Metal Finishes
  { id: 'metal-gold', name: 'Polished Gold', category: 'Metal Finishes', colorHex: '#FFD700' },
  { id: 'metal-brass', name: 'Brushed Brass', category: 'Metal Finishes', colorHex: '#B5A642' },
  { id: 'metal-chrome', name: 'Chrome', category: 'Metal Finishes', colorHex: '#C0C0C0' },
  { id: 'metal-nickel', name: 'Brushed Nickel', category: 'Metal Finishes', colorHex: '#9E9E9E' },
  { id: 'metal-black', name: 'Matte Black Metal', category: 'Metal Finishes', colorHex: '#1A1A1A' },
  { id: 'metal-copper', name: 'Copper', category: 'Metal Finishes', colorHex: '#B87333' },
  { id: 'metal-bronze', name: 'Antique Bronze', category: 'Metal Finishes', colorHex: '#665D1E' },
  { id: 'metal-iron', name: 'Wrought Iron', category: 'Metal Finishes', colorHex: '#534B4F' },

  // Wallpapers
  { id: 'wall-grasscloth', name: 'Grasscloth', category: 'Wallpapers', colorHex: '#C2B280' },
  { id: 'wall-textured-white', name: 'Textured White', category: 'Wallpapers', colorHex: '#FAFAFA' },
  { id: 'wall-damask', name: 'Damask Pattern', category: 'Wallpapers', colorHex: '#E8E0D5' },
  { id: 'wall-geometric', name: 'Geometric Pattern', category: 'Wallpapers', colorHex: '#D3D3D3' },
  { id: 'wall-floral', name: 'Floral Print', category: 'Wallpapers', colorHex: '#F0E6D3' },
  { id: 'wall-brick-white', name: 'White Brick', category: 'Wallpapers', colorHex: '#F5F5F5' },
  { id: 'wall-brick-exposed', name: 'Exposed Brick', category: 'Wallpapers', colorHex: '#8B4513' },
  { id: 'wall-concrete', name: 'Concrete Wall', category: 'Wallpapers', colorHex: '#B8B8B8' },
];

// Fetch custom finishes from database
export async function fetchCustomFinishes(): Promise<FinishItem[]> {
  const { data, error } = await supabase
    .from('custom_finishes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map(item => ({
    id: item.id,
    name: item.name,
    category: item.category || 'My Finishes',
    imageUrl: item.image_url,
    colorHex: item.color_hex || undefined,
    description: item.description || undefined,
    isCustom: true,
  }));
}

export function getFinishesByCategory(category: FinishCategory, customFinishes: FinishItem[] = []): FinishItem[] {
  if (category === 'All') {
    return [...customFinishes, ...DEFAULT_FINISHES];
  }
  if (category === 'My Finishes') {
    return customFinishes;
  }
  return DEFAULT_FINISHES.filter(f => f.category === category);
}

export function searchFinishes(query: string, category: FinishCategory = 'All', customFinishes: FinishItem[] = []): FinishItem[] {
  const finishes = getFinishesByCategory(category, customFinishes);
  if (!query.trim()) return finishes;
  
  const lowerQuery = query.toLowerCase();
  return finishes.filter(f => 
    f.name.toLowerCase().includes(lowerQuery) ||
    f.category.toLowerCase().includes(lowerQuery) ||
    f.description?.toLowerCase().includes(lowerQuery)
  );
}
