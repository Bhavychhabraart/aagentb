/**
 * BentChair Furniture Catalog API Service
 */

export interface CatalogFurnitureItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  imageUrl?: string;
  brand?: string;
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

function inferCategory(category: string, title: string): string {
  const t = title.toLowerCase();
  const c = category.toLowerCase();

  if (c.includes('rug') || t.includes('rug')) return 'Decoration';
  if (c.includes('art') || t.includes('art')) return 'Decoration';
  if (t.includes('sofa') || t.includes('couch') || c.includes('sofa')) return 'Seating';
  if (t.includes('chair') || t.includes('seat') || t.includes('armchair')) return 'Seating';
  if (t.includes('dining table') || c.includes('dining')) return 'Tables';
  if (t.includes('coffee') || t.includes('center')) return 'Tables';
  if (t.includes('side table') || t.includes('end table')) return 'Tables';
  if (t.includes('bed')) return 'Bedroom';
  if (t.includes('cabinet') || t.includes('console') || t.includes('tv')) return 'Storage';
  if (t.includes('lamp') || t.includes('light')) return 'Lighting';
  return 'Decoration';
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

export async function fetchFurnitureCatalog(): Promise<CatalogFurnitureItem[]> {
  try {
    const [furnitureResult, artResult, rugsResult] = await Promise.allSettled([
      fetchCategory('furniture'),
      fetchCategory('art'),
      fetchCategory('rugs')
    ]);

    const furnitureData = furnitureResult.status === 'fulfilled' ? furnitureResult.value : [];
    const artData = artResult.status === 'fulfilled' ? artResult.value : [];
    const rugsData = rugsResult.status === 'fulfilled' ? rugsResult.value : [];

    const furniture = furnitureData.map(p => ({ ...p, _inferred_category: 'Furniture' }));
    const art = artData.map(p => ({ ...p, _inferred_category: 'Art' }));
    const rugs = rugsData.map(p => ({ ...p, _inferred_category: 'Rug' }));

    const allProducts = [...furniture, ...art, ...rugs];

    if (allProducts.length === 0) return FALLBACK_CATALOG;

    // Shuffle
    for (let i = allProducts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allProducts[i], allProducts[j]] = [allProducts[j], allProducts[i]];
    }

    const adapted: CatalogFurnitureItem[] = allProducts.map(p => {
      const title = p.product_name || p.title || p.name || 'Unknown Item';
      const category = p.cat_name || p._inferred_category || 'Decor';
      const inferredCat = inferCategory(category, title);
      const imageUrl = getBentchairImageUrl(p);

      return {
        id: p.id ? p.id.toString() : Math.random().toString(36).substring(7),
        name: title,
        category: inferredCat,
        description: `BentStudio Collection: ${title}. A premium ${category} piece.`,
        imageUrl: imageUrl || undefined,
        price: p.price ? parseFloat(p.price.toString()) : 0,
        brand: 'BentStudio'
      };
    }).filter(item => item.imageUrl);

    return adapted.length > 0 ? adapted : FALLBACK_CATALOG;
  } catch (error) {
    console.error("Catalog fetch failed, using fallback:", error);
    return FALLBACK_CATALOG;
  }
}
