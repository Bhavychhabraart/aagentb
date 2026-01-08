/**
 * BentChair Furniture Catalog API Service
 */

import { supabase } from '@/integrations/supabase/client';

export interface CatalogFurnitureItem {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  brand?: string;
  vendorId?: string;
  isVendorProduct?: boolean;
  source?: 'catalog' | 'vendor' | 'custom';
}

interface BentchairProduct {
  id: number | string;
  title?: string;
  product_name?: string;
  name?: string;
  image?: string;
  transparent_image?: string;
  default_image?: string;
  image_url?: string;
  price?: number | string;
  cat_name?: string;
  _inferred_category?: string;
}

interface CatalogueResponse {
  product: BentchairProduct[];
  status?: string;
}

const API_BASE_URL = 'https://app.bentchair.com/api/v2';
const API_TOKEN = 'uhUQGZPJhuwQ3zxEQkkIkBQZ9ekgQ';
const IMAGE_PROXY = 'https://images.weserv.nl/?url=';

// Fallback data
const FALLBACK_CATALOG: CatalogFurnitureItem[] = [
  { id: 'sofa-1', name: 'BentStudio Cloud Sofa', category: 'Seating', description: 'White bouclé curved sofa, minimalist design', price: 2500, imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80', brand: 'BentStudio' },
  { id: 'sofa-2', name: 'BentStudio Noir Leather', category: 'Seating', description: 'Black matte Italian leather sectional', price: 3200, imageUrl: 'https://images.unsplash.com/photo-1550254478-ead40cc54513?auto=format&fit=crop&w=400&q=80', brand: 'BentStudio' },
  { id: 'chair-1', name: 'BentStudio Accent Chair', category: 'Seating', description: 'Velvet rust-colored armchair with gold accents', price: 850, imageUrl: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=400&q=80', brand: 'BentStudio' },
  { id: 'table-1', name: 'BentStudio Oak Coffee Table', category: 'Tables', description: 'Raw edge solid oak coffee table', price: 1200, imageUrl: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=400&q=80', brand: 'BentStudio' },
  { id: 'lamp-1', name: 'BentStudio Arc Lamp', category: 'Lighting', description: 'Oversized floor arch lamp, brushed steel', price: 450, imageUrl: 'https://images.unsplash.com/photo-1513506003011-3b03c80165bd?auto=format&fit=crop&w=400&q=80', brand: 'BentStudio' },
  { id: 'bed-1', name: 'BentStudio Royal Bed', category: 'Bedroom', description: 'King size platform bed, linen headboard', price: 4000, imageUrl: 'https://images.unsplash.com/photo-1505693416388-b0346efee539?auto=format&fit=crop&w=400&q=80', brand: 'BentStudio' },
  // New category fallbacks
  { id: 'outdoor-1', name: 'BentStudio Patio Set', category: 'Outdoor', description: 'Weather-resistant outdoor seating set', price: 1800, imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=400&q=80', brand: 'BentStudio' },
  { id: 'light-1', name: 'BentStudio Chandelier', category: 'Lighting', description: 'Modern crystal chandelier', price: 650, imageUrl: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=400&q=80', brand: 'BentStudio' },
  { id: 'decor-1', name: 'BentStudio Ceramic Vase', category: 'Decor', description: 'Handcrafted ceramic vase', price: 120, imageUrl: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=400&q=80', brand: 'BentStudio' },
  { id: 'wall-1', name: 'BentStudio Wall Panel', category: 'Walls', description: 'Decorative 3D wall panel', price: 85, imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=80', brand: 'BentStudio' },
  { id: 'mosaic-1', name: 'BentStudio Mosaic Tile', category: 'Mosaics', description: 'Artisan mosaic tile set', price: 95, imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=80', brand: 'BentStudio' },
];

function getBentchairImageUrl(product: BentchairProduct): string | null {
  const imageUrl = product.image ||
    product.transparent_image ||
    product.default_image ||
    product.image_url ||
    null;

  if (imageUrl) {
    const urlWithoutProtocol = imageUrl.replace(/^https?:\/\//, '');
    // High resolution images for accurate AI furniture analysis and staging
    return `${IMAGE_PROXY}${urlWithoutProtocol}&w=1200&h=1200&fit=contain&output=png&q=95`;
  }
  return null;
}

interface CategoryResult {
  category: string;
  subcategory?: string;
}

function inferCategoryAndSubcategory(category: string, title: string): CategoryResult {
  const t = title.toLowerCase();
  const c = category.toLowerCase();

  // Rugs
  if (c.includes('rug') || t.includes('rug')) {
    if (t.includes('hand-knotted') || t.includes('hand knotted')) return { category: 'Rugs', subcategory: 'Hand-Knotted' };
    if (t.includes('hand-tufted') || t.includes('hand tufted')) return { category: 'Rugs', subcategory: 'Hand-Tufted' };
    if (t.includes('flat weave') || t.includes('flatweave')) return { category: 'Rugs', subcategory: 'Flat Weave' };
    return { category: 'Rugs' };
  }
  
  // Art
  if (c.includes('art') || t.includes('art') || t.includes('painting') || t.includes('print')) {
    if (t.includes('painting')) return { category: 'Art', subcategory: 'Paintings' };
    if (t.includes('print')) return { category: 'Art', subcategory: 'Prints' };
    if (t.includes('sculpture')) return { category: 'Art', subcategory: 'Sculptures' };
    return { category: 'Art' };
  }
  
  // Outdoor - check before general seating
  if (c.includes('outdoor') || t.includes('patio') || t.includes('garden') || t.includes('outdoor')) {
    if (t.includes('chair') || t.includes('seat')) return { category: 'Outdoor', subcategory: 'Outdoor Chairs' };
    if (t.includes('sofa') || t.includes('couch')) return { category: 'Outdoor', subcategory: 'Outdoor Sofas' };
    if (t.includes('table')) return { category: 'Outdoor', subcategory: 'Outdoor Tables' };
    return { category: 'Outdoor' };
  }
  
  // Lighting
  if (c.includes('lighting') || t.includes('lamp') || t.includes('light') || t.includes('chandelier') || t.includes('sconce') || t.includes('pendant')) {
    if (t.includes('table lamp') || t.includes('desk lamp')) return { category: 'Lighting', subcategory: 'Table Lamps' };
    if (t.includes('floor lamp')) return { category: 'Lighting', subcategory: 'Floor Lamps' };
    if (t.includes('ceiling') || t.includes('wall') || t.includes('chandelier') || t.includes('pendant') || t.includes('sconce')) 
      return { category: 'Lighting', subcategory: 'Ceiling & Wall Lights' };
    return { category: 'Lighting' };
  }
  
  // Hospitality
  if (c.includes('hospitality') || t.includes('hospitality') || t.includes('hotel')) {
    if (t.includes('bar chair') || t.includes('bar stool')) return { category: 'Hospitality', subcategory: 'Bar Chairs' };
    if (t.includes('bar table')) return { category: 'Hospitality', subcategory: 'Bar Tables' };
    if (t.includes('dining chair')) return { category: 'Hospitality', subcategory: 'Hospitality Dining Chairs' };
    if (t.includes('lounge chair')) return { category: 'Hospitality', subcategory: 'Hospitality Lounge Chairs' };
    if (t.includes('sofa')) return { category: 'Hospitality', subcategory: 'Hospitality Sofas' };
    if (t.includes('coffee table')) return { category: 'Hospitality', subcategory: 'Coffee Tables' };
    if (t.includes('dining table')) return { category: 'Hospitality', subcategory: 'Dining Tables' };
    return { category: 'Hospitality' };
  }
  
  // Seating
  if (t.includes('sofa') || t.includes('couch') || c.includes('sofa')) return { category: 'Seating', subcategory: 'Sofas' };
  if (t.includes('armchair') || t.includes('arm chair')) return { category: 'Seating', subcategory: 'Armchairs' };
  if (t.includes('dining chair')) return { category: 'Seating', subcategory: 'Dining Chairs' };
  if (t.includes('lounge chair')) return { category: 'Seating', subcategory: 'Lounge Chairs' };
  if (t.includes('stool')) return { category: 'Seating', subcategory: 'Stools' };
  if (t.includes('bench')) return { category: 'Seating', subcategory: 'Benches' };
  if (t.includes('chair') || t.includes('seat')) return { category: 'Seating' };
  
  // Tables
  if (t.includes('dining table') || c.includes('dining')) return { category: 'Tables', subcategory: 'Dining Tables' };
  if (t.includes('coffee table') || t.includes('center table')) return { category: 'Tables', subcategory: 'Coffee Tables' };
  if (t.includes('side table') || t.includes('end table')) return { category: 'Tables', subcategory: 'Side Tables' };
  if (t.includes('console')) return { category: 'Tables', subcategory: 'Console Tables' };
  if (t.includes('table')) return { category: 'Tables' };
  
  // Bedroom
  if (t.includes('bed') || t.includes('mattress') || t.includes('headboard')) {
    if (t.includes('nightstand') || t.includes('bedside')) return { category: 'Bedroom', subcategory: 'Nightstands' };
    if (t.includes('dresser')) return { category: 'Bedroom', subcategory: 'Dressers' };
    return { category: 'Bedroom', subcategory: 'Beds' };
  }
  
  // Storage
  if (t.includes('cabinet') || t.includes('tv') || t.includes('shelf') || t.includes('bookcase')) {
    if (t.includes('tv') || t.includes('media')) return { category: 'Storage', subcategory: 'TV Units' };
    if (t.includes('shelf') || t.includes('bookcase')) return { category: 'Storage', subcategory: 'Shelves' };
    return { category: 'Storage', subcategory: 'Cabinets' };
  }
  
  // Walls
  if (c.includes('wall') || t.includes('wall panel') || t.includes('wallpaper') || t.includes('wall art')) {
    if (t.includes('mirror')) return { category: 'Walls', subcategory: 'Mirrors' };
    if (t.includes('wallpaper')) return { category: 'Walls', subcategory: 'Wallpapers' };
    return { category: 'Walls' };
  }
  
  // Mosaics
  if (c.includes('mosaic') || t.includes('mosaic') || t.includes('tile')) {
    if (t.includes('floor')) return { category: 'Mosaics', subcategory: 'Floor Mosaics' };
    if (t.includes('wall')) return { category: 'Mosaics', subcategory: 'Wall Mosaics' };
    return { category: 'Mosaics' };
  }
  
  // Decor
  if (c.includes('decor') || t.includes('vase') || t.includes('sculpture') || t.includes('accessory') || t.includes('mirror') || t.includes('clock')) {
    if (t.includes('vase') || t.includes('planter')) {
      if (t.includes('floor')) return { category: 'Decor', subcategory: 'Floor Planters' };
      return { category: 'Decor', subcategory: 'Vases & Planters' };
    }
    if (t.includes('tray') || t.includes('bowl') || t.includes('pot')) return { category: 'Decor', subcategory: 'Trays & Bowls' };
    if (t.includes('brass')) return { category: 'Decor', subcategory: 'Brass Decor' };
    if (t.includes('mirror')) return { category: 'Walls', subcategory: 'Mirrors' };
    return { category: 'Decor' };
  }
  
  return { category: 'Decor' };
}

async function fetchCategory(href: string): Promise<BentchairProduct[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/get-products-catalogwise?href=${href}`, {
      method: 'GET',
      headers: {
        'apitoken': API_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) return [];
    const data: CatalogueResponse = await response.json();
    return Array.isArray(data.product) ? data.product : [];
  } catch (error) {
    console.error(`Error fetching ${href} category:`, error);
    return [];
  }
}

// Fetch vendor products from Supabase
export async function fetchVendorProducts(): Promise<CatalogFurnitureItem[]> {
  try {
    const { data, error } = await supabase
      .from('vendor_products')
      .select('*')
      .eq('is_active', true);

    if (error || !data) return [];

    return data.map(p => ({
      id: `vendor-${p.id}`,
      name: p.name,
      category: p.category,
      description: p.description || `Vendor product: ${p.name}`,
      price: p.price,
      imageUrl: p.image_url || undefined,
      brand: 'Vendor',
      vendorId: p.vendor_id,
      isVendorProduct: true,
    }));
  } catch (error) {
    console.error('Failed to fetch vendor products:', error);
    return [];
  }
}

export async function fetchFurnitureCatalog(): Promise<CatalogFurnitureItem[]> {
  try {
    // Fetch from both BentChair API and vendor products in parallel
    const [bentchairResult, vendorProducts] = await Promise.all([
      (async () => {
        const [
          furnitureResult,
          artResult,
          rugsResult,
          outdoorResult,
          hospitalityResult,
          lightingResult,
          wallsResult,
          mosaicsResult,
          decorResult
        ] = await Promise.allSettled([
          fetchCategory('furniture'),
          fetchCategory('art'),
          fetchCategory('rugs'),
          fetchCategory('outdoor'),
          fetchCategory('hospitality'),
          fetchCategory('lighting'),
          fetchCategory('walls'),
          fetchCategory('mosaics'),
          fetchCategory('decor')
        ]);

        const furnitureData = furnitureResult.status === 'fulfilled' ? furnitureResult.value : [];
        const artData = artResult.status === 'fulfilled' ? artResult.value : [];
        const rugsData = rugsResult.status === 'fulfilled' ? rugsResult.value : [];
        const outdoorData = outdoorResult.status === 'fulfilled' ? outdoorResult.value : [];
        const hospitalityData = hospitalityResult.status === 'fulfilled' ? hospitalityResult.value : [];
        const lightingData = lightingResult.status === 'fulfilled' ? lightingResult.value : [];
        const wallsData = wallsResult.status === 'fulfilled' ? wallsResult.value : [];
        const mosaicsData = mosaicsResult.status === 'fulfilled' ? mosaicsResult.value : [];
        const decorData = decorResult.status === 'fulfilled' ? decorResult.value : [];

        const furniture = furnitureData.map(p => ({ ...p, _inferred_category: 'Furniture' }));
        const art = artData.map(p => ({ ...p, _inferred_category: 'Art' }));
        const rugs = rugsData.map(p => ({ ...p, _inferred_category: 'Rugs' }));
        const outdoor = outdoorData.map(p => ({ ...p, _inferred_category: 'Outdoor' }));
        const hospitality = hospitalityData.map(p => ({ ...p, _inferred_category: 'Hospitality' }));
        const lighting = lightingData.map(p => ({ ...p, _inferred_category: 'Lighting' }));
        const walls = wallsData.map(p => ({ ...p, _inferred_category: 'Walls' }));
        const mosaics = mosaicsData.map(p => ({ ...p, _inferred_category: 'Mosaics' }));
        const decor = decorData.map(p => ({ ...p, _inferred_category: 'Decor' }));

        return [...furniture, ...art, ...rugs, ...outdoor, ...hospitality, ...lighting, ...walls, ...mosaics, ...decor];
      })(),
      fetchVendorProducts()
    ]);

    const allBentchairProducts = bentchairResult;

    if (allBentchairProducts.length === 0 && vendorProducts.length === 0) {
      return FALLBACK_CATALOG;
    }

    // Shuffle BentChair products
    for (let i = allBentchairProducts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allBentchairProducts[i], allBentchairProducts[j]] = [allBentchairProducts[j], allBentchairProducts[i]];
    }

    const bentchairAdapted: CatalogFurnitureItem[] = allBentchairProducts.map(p => {
      const title = p.product_name || p.title || p.name || 'Unknown Item';
      const category = p.cat_name || p._inferred_category || 'Decor';
      const { category: inferredCat, subcategory } = inferCategoryAndSubcategory(category, title);
      const imageUrl = getBentchairImageUrl(p);

      return {
        id: p.id ? p.id.toString() : Math.random().toString(36).substring(7),
        name: title,
        category: inferredCat,
        subcategory,
        description: `BentStudio Collection: ${title}. A premium ${category} piece.`,
        imageUrl: imageUrl || undefined,
        price: p.price ? parseFloat(p.price.toString()) : 0,
        brand: 'BentStudio'
      };
    }).filter(item => item.imageUrl);

    // Merge vendor products with BentChair products (vendor products first for visibility)
    const allProducts = [...vendorProducts, ...bentchairAdapted];

    return allProducts.length > 0 ? allProducts : FALLBACK_CATALOG;
  } catch (error) {
    console.error("Catalog fetch failed, using fallback:", error);
    return FALLBACK_CATALOG;
  }
}
