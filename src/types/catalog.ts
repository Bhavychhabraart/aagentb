export interface BentChairCategory {
  id: string;
  name: string;
  slug: string;
  level: 'parent' | 'child' | 'grandchild';
  parentId?: string;
  children?: BentChairCategory[];
  productCount?: number;
  icon?: string;
}

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

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  children?: CategoryNode[];
}

export interface CatalogFilters {
  search: string;
  category: string | null;
  priceRange: [number, number];
  materials: string[];
  colors: string[];
  inStock: boolean;
}

export interface CanvasItem {
  id: string;
  type: 'product' | 'swatch' | 'reference' | 'note' | 'layout';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  locked: boolean;
  data: ProductCanvasData | SwatchCanvasData | ReferenceCanvasData | NoteCanvasData | LayoutCanvasData;
}

export interface ProductCanvasData {
  product: BentChairProduct;
  quantity: number;
}

export interface SwatchCanvasData {
  color: string;
  name: string;
  material?: string;
}

export interface ReferenceCanvasData {
  imageUrl: string;
  caption?: string;
}

export interface NoteCanvasData {
  text: string;
  color: 'yellow' | 'pink' | 'blue' | 'green' | 'purple';
}

export interface LayoutCanvasData {
  imageUrl: string;
  opacity: number;
}

export type CanvasItemData = ProductCanvasData | SwatchCanvasData | ReferenceCanvasData | NoteCanvasData | LayoutCanvasData;
