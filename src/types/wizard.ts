export interface WizardSession {
  id: string;
  user_id: string;
  project_id?: string;
  layout_file_url?: string;
  layout_thumbnail_url?: string;
  room_dimensions?: RoomDimensions;
  room_type?: string;
  mood_board_data?: MoodBoardData;
  color_palette?: string[];
  style_references?: StyleReference[];
  placed_products?: PlacedProduct[];
  custom_products?: CustomProduct[];
  generated_render_url?: string;
  boq_data?: BOQData;
  current_step: number;
  status: 'in_progress' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface RoomDimensions {
  width: number;
  depth: number;
  height?: number;
  unit: 'ft' | 'm';
}

export interface MoodBoardData {
  canvasState?: Record<string, unknown>;
  zones?: CanvasZone[];
}

export interface CanvasZone {
  id: string;
  name: string;
  type: string;
  bounds: { x: number; y: number; width: number; height: number };
  color: string;
}

export interface StyleReference {
  id: string;
  url: string;
  name?: string;
  type: 'uploaded' | 'generated';
}

export interface PlacedProduct {
  id: string;
  productId: string;
  name: string;
  category: string;
  imageUrl?: string;
  position: { x: number; y: number };
  rotation: number;
  dimensions: { width: number; depth: number; height: number };
  price?: number;
  description?: string;
  isCustom: boolean;
  color?: string;
}

export interface CustomProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  prompt: string;
  imageUrl?: string;
  estimatedPrice: { min: number; max: number };
  dimensions: { width: number; depth: number; height: number };
  materials?: string[];
  generatedAt: string;
}

export interface BOQItem {
  id: string;
  productId: string;
  name: string;
  category: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isCustom: boolean;
  notes?: string;
}

export interface BOQData {
  items: BOQItem[];
  subtotal: number;
  designFee: number;
  designFeePercent: number;
  grandTotal: number;
  currency: string;
}

export interface WizardStep {
  number: number;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
}

export const ROOM_TYPES = [
  'Living Room',
  'Bedroom',
  'Kitchen',
  'Dining Room',
  'Home Office',
  'Bathroom',
  'Kids Room',
  'Balcony',
  'Foyer',
  'Other'
] as const;

export const PRODUCT_CATEGORIES = [
  'Seating',
  'Tables',
  'Storage',
  'Lighting',
  'Decor',
  'Rugs',
  'Beds',
  'Outdoor',
  'Custom'
] as const;
