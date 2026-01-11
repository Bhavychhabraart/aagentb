import { BentChairCategory, CategoryNode } from '@/types/catalog';

export interface BentChairProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  category: string;
  categorySlug: string;
  parentCategory?: string;
  brand?: string;
  description?: string;
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
  };
  materials?: string[];
  colors?: string[];
  inStock?: boolean;
  leadTime?: string;
}

// Complete BentChair category hierarchy
export const BENTCHAIR_CATEGORY_TREE: CategoryNode[] = [
  {
    id: 'furniture',
    name: 'Furniture',
    slug: 'furniture',
    icon: 'Sofa',
    children: [
      {
        id: 'sofa-and-benches',
        name: 'Sofas & Benches',
        slug: 'sofa-and-benches',
        children: [
          { id: 'three-seater-sofas', name: 'Three Seater Sofas', slug: 'three-seater-sofas' },
          { id: 'two-seater-sofas', name: 'Two Seater Sofas', slug: 'two-seater-sofas' },
          { id: 'curved-sofas', name: 'Curved Sofas', slug: 'curved-sofas' },
          { id: 'l-shaped-sofas', name: 'L-Shaped Sofas', slug: 'l-shaped-sofas' },
          { id: 'chesterfield-sofas', name: 'Chesterfield Sofas', slug: 'chesterfield-sofas' },
          { id: 'benches', name: 'Benches', slug: 'benches' },
          { id: 'modular-sofas', name: 'Modular Sofas', slug: 'modular-sofas' },
        ]
      },
      {
        id: 'chairs-and-pouffes',
        name: 'Chairs & Pouffes',
        slug: 'chairs-and-pouffes',
        children: [
          { id: 'lounge-and-accent-chairs', name: 'Lounge & Accent Chairs', slug: 'lounge-and-accent-chairs' },
          { id: 'dining-chairs', name: 'Dining Chairs', slug: 'dining-chairs' },
          { id: 'wingback-chairs', name: 'Wingback Chairs', slug: 'wingback-chairs' },
          { id: 'armchairs', name: 'Armchairs', slug: 'armchairs' },
          { id: 'ottomans-pouffe', name: 'Ottomans & Pouffes', slug: 'ottomans-pouffe' },
          { id: 'bar-stools', name: 'Bar Stools', slug: 'bar-stools' },
          { id: 'swivel-chairs', name: 'Swivel Chairs', slug: 'swivel-chairs' },
        ]
      },
      {
        id: 'furniture-tables',
        name: 'Tables & Consoles',
        slug: 'furniture-tables',
        children: [
          { id: 'coffee-tables', name: 'Coffee Tables', slug: 'coffee-tables' },
          { id: 'dining-tables', name: 'Dining Tables', slug: 'dining-tables' },
          { id: 'end-tables', name: 'End & Side Tables', slug: 'end-tables' },
          { id: 'bed-side-tables', name: 'Bedside Tables', slug: 'bed-side-tables' },
          { id: 'console-tables', name: 'Console Tables', slug: 'console-tables' },
          { id: 'sideboards', name: 'Sideboards', slug: 'sideboards' },
          { id: 'nesting-tables', name: 'Nesting Tables', slug: 'nesting-tables' },
        ]
      },
      {
        id: 'bedroom',
        name: 'Bedroom',
        slug: 'bedroom',
        children: [
          { id: 'beds', name: 'Beds', slug: 'beds' },
          { id: 'bedroom-benches', name: 'Bedroom Benches', slug: 'bedroom-benches' },
          { id: 'dressers', name: 'Dressers', slug: 'dressers' },
        ]
      },
      {
        id: 'cabinet-and-shelves',
        name: 'Cabinets & Shelves',
        slug: 'cabinet-and-shelves',
        children: [
          { id: 'furniture-cabinets', name: 'Cabinets', slug: 'furniture-cabinets' },
          { id: 'media-unit', name: 'Media Units', slug: 'media-unit' },
          { id: 'bar-cabinets', name: 'Bar Cabinets', slug: 'bar-cabinets' },
          { id: 'bookshelves', name: 'Bookshelves', slug: 'bookshelves' },
        ]
      },
    ]
  },
  {
    id: 'outdoor',
    name: 'Outdoor',
    slug: 'outdoor',
    icon: 'Sun',
    children: [
      { id: 'outdoor-chairs', name: 'Outdoor Chairs', slug: 'outdoor-chairs' },
      { id: 'outdoor-sofas', name: 'Outdoor Sofas', slug: 'outdoor-sofas' },
      { id: 'outdoor-tables', name: 'Outdoor Tables', slug: 'outdoor-tables' },
      { id: 'outdoor-loungers', name: 'Loungers', slug: 'outdoor-loungers' },
      { id: 'outdoor-sets', name: 'Outdoor Sets', slug: 'outdoor-sets' },
    ]
  },
  {
    id: 'lighting',
    name: 'Lighting',
    slug: 'lighting',
    icon: 'Lightbulb',
    children: [
      { id: 'table-lamps', name: 'Table Lamps', slug: 'table-lamps' },
      { id: 'ceiling-lamps', name: 'Ceiling & Pendant', slug: 'ceiling-lamps' },
      { id: 'floor-lamps', name: 'Floor Lamps', slug: 'floor-lamps' },
      { id: 'wall-sconces', name: 'Wall Sconces', slug: 'wall-sconces' },
      { id: 'chandeliers', name: 'Chandeliers', slug: 'chandeliers' },
    ]
  },
  {
    id: 'rugs',
    name: 'Rugs',
    slug: 'rugs',
    icon: 'Square',
    children: [
      { id: 'hand-tufted-rugs', name: 'Hand Tufted', slug: 'hand-tufted-rugs' },
      { id: 'hand-knotted-rugs', name: 'Hand Knotted', slug: 'hand-knotted-rugs' },
      { id: 'flatweave-rugs', name: 'Flatweave', slug: 'flatweave-rugs' },
      { id: 'outdoor-rugs', name: 'Outdoor Rugs', slug: 'outdoor-rugs' },
    ]
  },
  {
    id: 'decor',
    name: 'Decor',
    slug: 'decor',
    icon: 'Palette',
    children: [
      {
        id: 'wall-art',
        name: 'Art Gallery',
        slug: 'wall-art',
        children: [
          { id: 'embellished-wall-art', name: 'Embellished Art', slug: 'embellished-wall-art' },
          { id: 'contemporary-wall-art', name: 'Contemporary Art', slug: 'contemporary-wall-art' },
          { id: 'abstract-art', name: 'Abstract Art', slug: 'abstract-art' },
        ]
      },
      {
        id: 'wall-decor',
        name: 'Mirrors & Wall',
        slug: 'wall-decor',
        children: [
          { id: 'mirrors', name: 'Mirrors', slug: 'mirrors' },
          { id: 'wallpapers', name: 'Wallpapers', slug: 'wallpapers' },
          { id: 'wall-panels', name: 'Wall Panels', slug: 'wall-panels' },
        ]
      },
      {
        id: 'greens-and-planters',
        name: 'Planters',
        slug: 'greens-and-planters',
        children: [
          { id: 'tabletop-planters', name: 'Tabletop Planters', slug: 'tabletop-planters' },
          { id: 'floor-planters', name: 'Floor Planters', slug: 'floor-planters' },
          { id: 'hanging-planters', name: 'Hanging Planters', slug: 'hanging-planters' },
        ]
      },
      {
        id: 'resin',
        name: 'Accents',
        slug: 'resin',
        children: [
          { id: 'sculptures', name: 'Sculptures', slug: 'sculptures' },
          { id: 'candleware', name: 'Candleware', slug: 'candleware' },
          { id: 'vases', name: 'Vases', slug: 'vases' },
          { id: 'decorative-bowls', name: 'Decorative Bowls', slug: 'decorative-bowls' },
        ]
      },
    ]
  },
  {
    id: 'hospitality',
    name: 'Hospitality',
    slug: 'hospitality',
    icon: 'Building',
    children: [
      { id: 'hospitality-dining-chairs', name: 'Dining Chairs', slug: 'hospitality-dining-chairs' },
      { id: 'bar-tables', name: 'Bar Tables', slug: 'bar-tables' },
      { id: 'hospitality-bar-stools', name: 'Bar Stools', slug: 'hospitality-bar-stools' },
      { id: 'lounge-seating', name: 'Lounge Seating', slug: 'lounge-seating' },
    ]
  },
  {
    id: 'surfaces',
    name: 'Surfaces',
    slug: 'surfaces',
    icon: 'Layers',
    children: [
      { id: 'arcana', name: 'Arcana', slug: 'arcana' },
      { id: 'giardino', name: 'Giardino', slug: 'giardino' },
      { id: 'geo-matrix', name: 'Geo Matrix', slug: 'geo-matrix' },
      { id: 'stone-weave', name: 'Stone Weave', slug: 'stone-weave' },
      { id: 'terrazzo', name: 'Terrazzo', slug: 'terrazzo' },
    ]
  },
];

// Flatten categories for quick lookup
export function flattenCategories(nodes: CategoryNode[], parentId?: string): BentChairCategory[] {
  const result: BentChairCategory[] = [];
  
  for (const node of nodes) {
    const level = !parentId ? 'parent' : (node.children ? 'child' : 'grandchild');
    result.push({
      id: node.id,
      name: node.name,
      slug: node.slug,
      level,
      parentId,
      icon: node.icon,
    });
    
    if (node.children) {
      result.push(...flattenCategories(node.children, node.id));
    }
  }
  
  return result;
}

export const ALL_CATEGORIES = flattenCategories(BENTCHAIR_CATEGORY_TREE);

// API base URL
const API_BASE = 'https://app.bentchair.com/api/v2';

// Product cache
const productCache = new Map<string, { products: BentChairProduct[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function fetchProductsByCategory(
  categorySlug: string,
  page: number = 1,
  limit: number = 24
): Promise<{ products: BentChairProduct[]; total: number; hasMore: boolean }> {
  const cacheKey = `${categorySlug}-${page}-${limit}`;
  const cached = productCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { products: cached.products, total: cached.products.length, hasMore: cached.products.length === limit };
  }
  
  try {
    const response = await fetch(
      `${API_BASE}/products?category=${categorySlug}&page=${page}&limit=${limit}`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    
    if (!response.ok) {
      // Return mock data on API failure
      return getMockProducts(categorySlug, page, limit);
    }
    
    const data = await response.json();
    const products = transformAPIProducts(data.products || data.data || []);
    
    productCache.set(cacheKey, { products, timestamp: Date.now() });
    
    return {
      products,
      total: data.total || products.length,
      hasMore: products.length === limit,
    };
  } catch (error) {
    console.error('Failed to fetch from BentChair API:', error);
    return getMockProducts(categorySlug, page, limit);
  }
}

export async function searchProducts(
  query: string,
  filters?: { category?: string; priceMin?: number; priceMax?: number }
): Promise<BentChairProduct[]> {
  try {
    const params = new URLSearchParams({ q: query });
    if (filters?.category) params.append('category', filters.category);
    if (filters?.priceMin) params.append('price_min', String(filters.priceMin));
    if (filters?.priceMax) params.append('price_max', String(filters.priceMax));
    
    const response = await fetch(`${API_BASE}/products/search?${params}`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      return getMockProducts('all', 1, 20).products.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    const data = await response.json();
    return transformAPIProducts(data.products || data.data || []);
  } catch (error) {
    console.error('Search failed:', error);
    return getMockProducts('all', 1, 20).products.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase())
    );
  }
}

function transformAPIProducts(apiProducts: any[]): BentChairProduct[] {
  return apiProducts.map((p: any) => ({
    id: p.id || p._id || String(Math.random()),
    name: p.name || p.title || 'Untitled Product',
    slug: p.slug || p.handle || p.name?.toLowerCase().replace(/\s+/g, '-'),
    price: parseFloat(p.price) || parseFloat(p.variants?.[0]?.price) || 0,
    originalPrice: parseFloat(p.compare_at_price) || parseFloat(p.original_price),
    image: p.image?.src || p.images?.[0]?.src || p.featured_image || p.image || '/placeholder.svg',
    images: p.images?.map((img: any) => img.src || img) || [p.image],
    category: p.product_type || p.category || 'Uncategorized',
    categorySlug: p.category_slug || p.product_type?.toLowerCase().replace(/\s+/g, '-'),
    brand: p.vendor || p.brand,
    description: p.description || p.body_html,
    dimensions: p.dimensions || {},
    materials: p.tags?.filter((t: string) => t.startsWith('material:'))?.map((t: string) => t.replace('material:', '')) || [],
    colors: p.tags?.filter((t: string) => t.startsWith('color:'))?.map((t: string) => t.replace('color:', '')) || [],
    inStock: p.available !== false,
    leadTime: p.lead_time || '4-6 weeks',
  }));
}

// Mock product generator for when API is unavailable
function getMockProducts(category: string, page: number, limit: number): { products: BentChairProduct[]; total: number; hasMore: boolean } {
  const mockImages = [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
    'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400',
    'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=400',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=400',
    'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
    'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=400',
    'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400',
  ];
  
  const categoryNames: Record<string, string[]> = {
    'three-seater-sofas': ['Luxe Velvet Sofa', 'Monaco Sectional', 'Cloud 9 Sofa', 'Oslo Comfort'],
    'two-seater-sofas': ['Compact Love Seat', 'Urban Duo Sofa', 'Mini Monaco', 'Cozy Corner'],
    'lounge-and-accent-chairs': ['Egg Chair', 'Barcelona Chair', 'Wishbone Chair', 'Shell Accent'],
    'dining-chairs': ['Scandi Dining Chair', 'Modern Tulip', 'Windsor Classic', 'Bentwood Beauty'],
    'coffee-tables': ['Marble Cloud', 'Walnut Slab', 'Glass Nest', 'Brass & Stone'],
    'floor-lamps': ['Arc Lamp', 'Tripod Floor', 'Reading Arm', 'Sculptural Light'],
    default: ['Designer Piece', 'Modern Classic', 'Artisan Craft', 'Premium Select'],
  };
  
  const names = categoryNames[category] || categoryNames.default;
  const products: BentChairProduct[] = [];
  
  for (let i = 0; i < limit; i++) {
    const idx = (page - 1) * limit + i;
    products.push({
      id: `mock-${category}-${idx}`,
      name: `${names[i % names.length]} ${idx + 1}`,
      slug: `mock-${category}-${idx}`,
      price: Math.floor(Math.random() * 50000) + 10000,
      originalPrice: Math.random() > 0.7 ? Math.floor(Math.random() * 60000) + 15000 : undefined,
      image: mockImages[idx % mockImages.length],
      category: category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      categorySlug: category,
      brand: 'BentChair',
      inStock: Math.random() > 0.2,
      leadTime: ['2-3 weeks', '4-6 weeks', '6-8 weeks'][Math.floor(Math.random() * 3)],
    });
  }
  
  return { products, total: 48, hasMore: page < 2 };
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
}

export function getCategoryPath(categoryId: string): BentChairCategory[] {
  const path: BentChairCategory[] = [];
  let current = ALL_CATEGORIES.find(c => c.id === categoryId);
  
  while (current) {
    path.unshift(current);
    current = current.parentId ? ALL_CATEGORIES.find(c => c.id === current!.parentId) : undefined;
  }
  
  return path;
}
