/**
 * BentChair Upholstery/Fabric Data Service
 */

export interface UpholsteryItem {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  imageUrl?: string;
  colorHex?: string;
  material?: string;
  brand?: string;
  collection?: string;
}

interface BentchairUpholsteryItem {
  id: number | string;
  name?: string;
  title?: string;
  image?: string;
  image_url?: string;
  category?: string;
  subcategory?: string;
  color?: string;
  color_hex?: string;
  material?: string;
  brand?: string;
  collection?: string;
}

const UPHOLSTERY_API_URL = 'https://app.bentchair.com/bent/get-allupholstery-data';
const API_TOKEN = 'uhUQGZPJhuwQ3zxEQkkIkBQZ9ekgQ';
const IMAGE_PROXY = 'https://images.weserv.nl/?url=';

function getUpholsteryImageUrl(item: BentchairUpholsteryItem): string | null {
  const imageUrl = item.image || item.image_url || null;

  if (imageUrl) {
    const urlWithoutProtocol = imageUrl.replace(/^https?:\/\//, '');
    return `${IMAGE_PROXY}${urlWithoutProtocol}&w=400&h=400&fit=cover&output=jpg&q=85`;
  }
  return null;
}

function adaptUpholsteryItem(item: BentchairUpholsteryItem): UpholsteryItem {
  const imageUrl = getUpholsteryImageUrl(item);
  
  return {
    id: item.id ? item.id.toString() : Math.random().toString(36).substring(7),
    name: item.name || item.title || 'Unknown Fabric',
    category: item.category || 'Fabric',
    subcategory: item.subcategory,
    imageUrl: imageUrl || undefined,
    colorHex: item.color_hex || item.color,
    material: item.material,
    brand: item.brand,
    collection: item.collection,
  };
}

// Fallback upholstery data
const FALLBACK_UPHOLSTERY: UpholsteryItem[] = [
  { id: 'fabric-1', name: 'Velvet Navy', category: 'Velvet', colorHex: '#1a365d', material: 'Velvet', brand: 'BentStudio' },
  { id: 'fabric-2', name: 'Linen Natural', category: 'Linen', colorHex: '#f5f0e6', material: 'Linen', brand: 'BentStudio' },
  { id: 'fabric-3', name: 'Bouclé Cream', category: 'Bouclé', colorHex: '#faf8f5', material: 'Wool Blend', brand: 'BentStudio' },
  { id: 'fabric-4', name: 'Leather Cognac', category: 'Leather', colorHex: '#8b4513', material: 'Full Grain Leather', brand: 'BentStudio' },
  { id: 'fabric-5', name: 'Cotton Canvas', category: 'Cotton', colorHex: '#e8e4dc', material: 'Cotton', brand: 'BentStudio' },
  { id: 'fabric-6', name: 'Mohair Emerald', category: 'Mohair', colorHex: '#047857', material: 'Mohair', brand: 'BentStudio' },
];

export async function fetchUpholsteryData(): Promise<UpholsteryItem[]> {
  try {
    const response = await fetch(UPHOLSTERY_API_URL, {
      method: 'GET',
      headers: {
        'apitoken': API_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Upholstery API returned non-OK response, using fallback');
      return FALLBACK_UPHOLSTERY;
    }

    const data = await response.json();
    
    // Handle different possible response structures
    let items: BentchairUpholsteryItem[] = [];
    
    if (Array.isArray(data)) {
      items = data;
    } else if (data.upholstery && Array.isArray(data.upholstery)) {
      items = data.upholstery;
    } else if (data.data && Array.isArray(data.data)) {
      items = data.data;
    } else if (data.products && Array.isArray(data.products)) {
      items = data.products;
    }

    if (items.length === 0) {
      return FALLBACK_UPHOLSTERY;
    }

    return items.map(adaptUpholsteryItem);
  } catch (error) {
    console.error('Error fetching upholstery data:', error);
    return FALLBACK_UPHOLSTERY;
  }
}

// Get upholstery items by category
export async function fetchUpholsteryByCategory(category: string): Promise<UpholsteryItem[]> {
  const allUpholstery = await fetchUpholsteryData();
  return allUpholstery.filter(item => 
    item.category.toLowerCase() === category.toLowerCase()
  );
}

// Get unique upholstery categories
export async function getUpholsteryCategories(): Promise<string[]> {
  const allUpholstery = await fetchUpholsteryData();
  const categories = new Set(allUpholstery.map(item => item.category));
  return Array.from(categories).sort();
}
