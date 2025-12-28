export type LayoutTool = 'select' | 'move' | 'wall' | 'window' | 'door' | 'furniture' | 'rotate' | 'delete' | 'ai-zone';

export interface AIZoneSelection {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type UnitType = 'ft' | 'm' | 'in' | 'cm';

export interface RoomDimensions {
  width: number;
  depth: number;
  unit: UnitType;
}

export interface LayoutObject {
  id: string;
  type: 'wall' | 'window' | 'door' | 'furniture';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  properties: Record<string, unknown>;
}

export interface WallProperties {
  thickness: number;
  material?: string;
}

export interface DoorProperties {
  swingDirection: 'left' | 'right';
  type: 'single' | 'double' | 'sliding';
}

export interface WindowProperties {
  height: number;
  sillHeight?: number;
}

export interface FurnitureProperties {
  catalogItemId?: string;
  name: string;
  category: string;
  imageUrl?: string;
  isCustom?: boolean;
}

export interface LayoutData {
  id?: string;
  project_id: string;
  user_id: string;
  name: string;
  room_dimensions: RoomDimensions;
  canvas_data: object | null;
  thumbnail_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FurnitureBlockDefinition {
  id: string;
  name: string;
  category: string;
  width: number; // in inches
  depth: number; // in inches
  shape: 'rect' | 'circle' | 'L-shape' | 'custom';
  color: string;
  icon?: string;
}

export const FURNITURE_LIBRARY: FurnitureBlockDefinition[] = [
  // Seating
  { id: 'sofa-3', name: '3-Seater Sofa', category: 'Seating', width: 84, depth: 36, shape: 'rect', color: '#6366f1' },
  { id: 'sofa-2', name: '2-Seater Sofa', category: 'Seating', width: 60, depth: 36, shape: 'rect', color: '#6366f1' },
  { id: 'armchair', name: 'Armchair', category: 'Seating', width: 32, depth: 34, shape: 'rect', color: '#8b5cf6' },
  { id: 'ottoman', name: 'Ottoman', category: 'Seating', width: 24, depth: 24, shape: 'rect', color: '#a78bfa' },
  { id: 'dining-chair', name: 'Dining Chair', category: 'Seating', width: 18, depth: 20, shape: 'rect', color: '#c4b5fd' },
  
  // Tables
  { id: 'dining-table-6', name: 'Dining Table (6)', category: 'Tables', width: 72, depth: 36, shape: 'rect', color: '#f59e0b' },
  { id: 'dining-table-4', name: 'Dining Table (4)', category: 'Tables', width: 48, depth: 36, shape: 'rect', color: '#f59e0b' },
  { id: 'coffee-table', name: 'Coffee Table', category: 'Tables', width: 48, depth: 24, shape: 'rect', color: '#fbbf24' },
  { id: 'side-table', name: 'Side Table', category: 'Tables', width: 20, depth: 20, shape: 'rect', color: '#fcd34d' },
  { id: 'console-table', name: 'Console Table', category: 'Tables', width: 48, depth: 14, shape: 'rect', color: '#fde68a' },
  { id: 'desk', name: 'Desk', category: 'Tables', width: 60, depth: 30, shape: 'rect', color: '#fbbf24' },
  
  // Storage
  { id: 'wardrobe', name: 'Wardrobe', category: 'Storage', width: 72, depth: 24, shape: 'rect', color: '#10b981' },
  { id: 'bookshelf', name: 'Bookshelf', category: 'Storage', width: 36, depth: 12, shape: 'rect', color: '#34d399' },
  { id: 'cabinet', name: 'Cabinet', category: 'Storage', width: 48, depth: 18, shape: 'rect', color: '#6ee7b7' },
  { id: 'dresser', name: 'Dresser', category: 'Storage', width: 60, depth: 20, shape: 'rect', color: '#a7f3d0' },
  { id: 'nightstand', name: 'Nightstand', category: 'Storage', width: 20, depth: 18, shape: 'rect', color: '#d1fae5' },
  
  // Beds
  { id: 'king-bed', name: 'King Bed', category: 'Beds', width: 76, depth: 80, shape: 'rect', color: '#ec4899' },
  { id: 'queen-bed', name: 'Queen Bed', category: 'Beds', width: 60, depth: 80, shape: 'rect', color: '#f472b6' },
  { id: 'double-bed', name: 'Double Bed', category: 'Beds', width: 54, depth: 75, shape: 'rect', color: '#f9a8d4' },
  { id: 'single-bed', name: 'Single Bed', category: 'Beds', width: 39, depth: 75, shape: 'rect', color: '#fbcfe8' },
  
  // Decor
  { id: 'rug-large', name: 'Large Rug', category: 'Decor', width: 96, depth: 60, shape: 'rect', color: '#06b6d4' },
  { id: 'rug-medium', name: 'Medium Rug', category: 'Decor', width: 60, depth: 36, shape: 'rect', color: '#22d3ee' },
  { id: 'plant-pot', name: 'Plant Pot', category: 'Decor', width: 18, depth: 18, shape: 'circle', color: '#2dd4bf' },
  { id: 'floor-lamp', name: 'Floor Lamp', category: 'Decor', width: 12, depth: 12, shape: 'circle', color: '#5eead4' },
];

export const FURNITURE_CATEGORIES = ['Seating', 'Tables', 'Storage', 'Beds', 'Decor'];

export const GRID_SIZES = [
  { label: '6"', value: 6 },
  { label: '1 ft', value: 12 },
  { label: '2 ft', value: 24 },
];

export const DEFAULT_WALL_THICKNESS = 6; // 6 inches
export const DEFAULT_DOOR_WIDTH = 36; // 36 inches
export const DEFAULT_WINDOW_WIDTH = 36; // 36 inches

export const PIXELS_PER_INCH = 4; // Scale: 4 pixels = 1 inch
