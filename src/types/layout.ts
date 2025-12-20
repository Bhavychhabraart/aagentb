export interface LayoutAnalysis {
  roomShape: 'rectangular' | 'L-shaped' | 'square' | 'irregular';
  dimensions: {
    width: number;
    depth: number;
    height: number;
    unit: 'feet' | 'meters';
  };
  aspectRatio: string;
  walls: WallSpec[];
  windows: WindowSpec[];
  doors: DoorSpec[];
  furnitureZones: FurnitureZone[];
  cameraRecommendation: CameraSpec;
  gridOverlay: string;
}

export interface WallSpec {
  position: 'north' | 'south' | 'east' | 'west';
  length: number;
  features: WallFeature[];
}

export interface WallFeature {
  type: 'window' | 'door' | 'opening' | 'built-in' | 'fireplace';
  positionPercent: number;
  widthPercent: number;
}

export interface WindowSpec {
  wall: 'north' | 'south' | 'east' | 'west';
  positionPercent: number;
  widthPercent: number;
  heightPercent: number;
  type: 'standard' | 'floor-to-ceiling' | 'bay' | 'skylight';
}

export interface DoorSpec {
  wall: 'north' | 'south' | 'east' | 'west';
  positionPercent: number;
  widthPercent: number;
  type: 'single' | 'double' | 'sliding' | 'french';
  swingDirection: 'inward' | 'outward' | 'left' | 'right';
}

export interface FurnitureZone {
  name: string;
  label: string;
  xStart: number;
  xEnd: number;
  yStart: number;
  yEnd: number;
  suggestedItems: string[];
}

export interface CameraSpec {
  position: 'southeast' | 'southwest' | 'northeast' | 'northwest' | 'center';
  angle: number;
  height: 'eye-level' | 'elevated' | 'low';
  fov: 'wide' | 'standard' | 'narrow';
}

export interface ValidationResult {
  overallScore: number;
  passed: boolean;
  checks: ValidationCheck[];
  discrepancies: string[];
  suggestions: string[];
}

export interface ValidationCheck {
  category: 'windows' | 'doors' | 'proportions' | 'furniture' | 'walls';
  name: string;
  expected: string;
  detected: string;
  score: number;
  passed: boolean;
}
