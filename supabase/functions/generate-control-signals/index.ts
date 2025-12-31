import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate control signals (depth map, edge map, region masks) for constrained rendering
// These signals force the AI to respect geometry

interface GeometryData {
  roomShape: string;
  dimensions: { width: number; depth: number; height: number; unit: string };
  walls: Array<{
    position: string;
    length: number;
    features: Array<{ type: string; positionPercent: number; widthPercent: number }>;
  }>;
  windows: Array<{
    wall: string;
    positionPercent: number;
    widthPercent: number;
    heightPercent: number;
  }>;
  doors: Array<{
    wall: string;
    positionPercent: number;
    widthPercent: number;
  }>;
  furnitureZones: Array<{
    name: string;
    xStart: number;
    xEnd: number;
    yStart: number;
    yEnd: number;
  }>;
}

interface FurnitureAnchor {
  id: string;
  position: { x: number; y: number };
  boundingBox: { width: number; height: number };
  occupied: boolean;
}

interface PlacementResult {
  anchorId: string;
  position: { x: number; y: number };
  boundingBox: { minX: number; maxX: number; minY: number; maxY: number };
}

interface ControlSignals {
  depthMapDescription: string;
  edgeMapDescription: string;
  regionMaskDescription: string;
  structuralConstraints: string;
  furniturePlacementGuide: string;
  lockingInstructions: string;
}

// Generate a text-based depth map description for AI consumption
function generateDepthMapDescription(geometry: GeometryData): string {
  const { dimensions, walls, roomShape } = geometry;
  
  let desc = `DEPTH MAP SPECIFICATION (Isometric View from Southeast Corner):
  
CAMERA: Elevated 45° above ground, looking northwest into room
ROOM: ${roomShape} shape, ${dimensions.width}×${dimensions.depth}×${dimensions.height} ${dimensions.unit}

DEPTH LAYERS (front to back):
`;

  // Floor plane
  desc += `
LAYER 0 - FLOOR (Closest to camera):
- Position: Bottom of frame
- Shape: ${roomShape === 'L-shaped' ? 'L-shaped polygon' : 'Rectangle'}
- Dimensions: ${dimensions.width}×${dimensions.depth} ${dimensions.unit}
- Visible area: ~60% of frame (floor visible from above)
`;

  // Walls
  desc += `
LAYER 1 - NEAR WALLS (South & East walls, closest):
`;
  
  for (const wall of walls) {
    if (wall.position === 'south' || wall.position === 'east') {
      desc += `- ${wall.position.toUpperCase()} wall: ${wall.length}${dimensions.unit} length, PARTIALLY visible (lower portion)
`;
    }
  }

  desc += `
LAYER 2 - FAR WALLS (North & West walls, furthest):
`;
  
  for (const wall of walls) {
    if (wall.position === 'north' || wall.position === 'west') {
      desc += `- ${wall.position.toUpperCase()} wall: ${wall.length}${dimensions.unit} length, FULLY visible
`;
    }
  }

  // Windows and doors
  desc += `
OPENINGS (affect depth):
`;
  
  for (const win of geometry.windows) {
    desc += `- Window on ${win.wall} wall: Position ${win.positionPercent}% from left, width ${win.widthPercent}%
  → Creates depth variation (recessed ~6 inches)
`;
  }
  
  for (const door of geometry.doors) {
    desc += `- Door on ${door.wall} wall: Position ${door.positionPercent}% from left
  → Creates opening/archway depth
`;
  }

  return desc;
}

// Generate edge map description
function generateEdgeMapDescription(geometry: GeometryData): string {
  const { dimensions, walls, windows, doors } = geometry;
  
  let desc = `EDGE MAP - STRUCTURAL LINES TO PRESERVE:

PRIMARY EDGES (MUST be visible in render):
`;

  // Room boundary edges
  desc += `
ROOM BOUNDARY (Bold edges):
- Floor-wall intersection: Continuous line around entire room perimeter
- Wall-ceiling intersection: Visible for north and west walls
- Corner vertices: 4 corner points for rectangular, 6 for L-shaped
`;

  // Wall feature edges
  for (const wall of walls) {
    const wallWindows = windows.filter(w => w.wall === wall.position);
    const wallDoors = doors.filter(d => d.wall === wall.position);
    
    if (wallWindows.length > 0 || wallDoors.length > 0) {
      desc += `
${wall.position.toUpperCase()} WALL EDGES (${wall.length}${dimensions.unit}):
`;
      for (const win of wallWindows) {
        desc += `- Window frame: Rectangle at ${win.positionPercent}% position, ${win.widthPercent}% width, ${win.heightPercent}% height
`;
      }
      for (const door of wallDoors) {
        desc += `- Door frame: Rectangle at ${door.positionPercent}% position, ${door.widthPercent}% width
`;
      }
    }
  }

  desc += `
SECONDARY EDGES:
- Baseboard lines along floor-wall intersection
- Crown molding along ceiling-wall intersection (if present)
- Window sill and header lines
`;

  return desc;
}

// Generate region mask description for inpainting control
function generateRegionMaskDescription(
  geometry: GeometryData, 
  anchors: FurnitureAnchor[],
  placements: PlacementResult[]
): string {
  let desc = `REGION MASK - AREAS FOR GENERATION/PRESERVATION:

LOCKED REGIONS (BLACK - DO NOT MODIFY):
`;

  // Walls are locked
  desc += `
□ ALL WALLS - Structure is frozen
□ ALL WINDOWS - Position/size fixed at:
`;
  for (const win of geometry.windows) {
    desc += `  - ${win.wall} wall: ${win.positionPercent}% position, ${win.widthPercent}% width
`;
  }

  desc += `□ ALL DOORS - Position/size fixed at:
`;
  for (const door of geometry.doors) {
    desc += `  - ${door.wall} wall: ${door.positionPercent}% position
`;
  }

  desc += `□ FLOOR BOUNDARIES - Room perimeter locked
□ CEILING - If visible, locked
`;

  // Editable regions
  desc += `
EDITABLE REGIONS (WHITE - CAN GENERATE):
`;

  for (const anchor of anchors) {
    const placement = placements.find(p => p.anchorId === anchor.id);
    if (placement) {
      desc += `
□ ${anchor.id}: Furniture placement zone
  - Center: (${anchor.position.x}%, ${anchor.position.y}%)
  - Bounds: X[${placement.boundingBox.minX}%-${placement.boundingBox.maxX}%] Y[${placement.boundingBox.minY}%-${placement.boundingBox.maxY}%]
  - Status: OCCUPIED - render furniture here
`;
    } else if (!anchor.occupied) {
      desc += `
□ ${anchor.id}: Empty zone
  - Center: (${anchor.position.x}%, ${anchor.position.y}%)
  - Size: ${anchor.boundingBox.width}% × ${anchor.boundingBox.height}%
  - Status: AVAILABLE - can add furniture or leave empty
`;
    }
  }

  desc += `
□ FLOOR SURFACE (texture only) - Can apply materials/textures
□ WALL SURFACES (texture only) - Can apply paint/wallpaper
`;

  return desc;
}

// Generate structural constraint summary
function generateStructuralConstraints(geometry: GeometryData): string {
  return `
IMMUTABLE STRUCTURAL CONSTRAINTS:

ROOM GEOMETRY (FROZEN):
- Shape: ${geometry.roomShape}
- Width: ${geometry.dimensions.width} ${geometry.dimensions.unit}
- Depth: ${geometry.dimensions.depth} ${geometry.dimensions.unit}
- Height: ${geometry.dimensions.height} ${geometry.dimensions.unit}
- Aspect Ratio: ${geometry.dimensions.width}:${geometry.dimensions.depth}

OPENING COUNT (EXACT):
- Windows: EXACTLY ${geometry.windows.length} (no more, no less)
- Doors: EXACTLY ${geometry.doors.length} (no more, no less)

CAMERA (LOCKED):
- Type: Isometric
- Position: Southeast corner, elevated 45°
- Direction: Looking northwest
- FOV: 60° (wide angle)

ANY DEVIATION FROM THESE VALUES = RENDER REJECTION
`;
}

// Generate furniture placement guide
function generateFurniturePlacementGuide(
  anchors: FurnitureAnchor[],
  placements: PlacementResult[]
): string {
  let guide = `
FURNITURE PLACEMENT MANIFEST:

Total anchors: ${anchors.length}
Occupied anchors: ${placements.length}

PLACEMENT COORDINATES (% of room dimensions):
`;

  for (const placement of placements) {
    const anchor = anchors.find(a => a.id === placement.anchorId);
    if (anchor) {
      guide += `
${anchor.id}:
  Center: (${placement.position.x}%, ${placement.position.y}%)
  Bounds: [${placement.boundingBox.minX}%, ${placement.boundingBox.minY}%] to [${placement.boundingBox.maxX}%, ${placement.boundingBox.maxY}%]
  Size: ${anchor.boundingBox.width}% × ${anchor.boundingBox.height}%
`;
    }
  }

  guide += `
PLACEMENT RULES:
1. Furniture centers MUST be within 2% of specified coordinates
2. Furniture CANNOT extend beyond specified bounds
3. Furniture CANNOT overlap other placement zones
4. Furniture MUST face room center (unless rotation specified)
`;

  return guide;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      geometryData, 
      furnitureAnchors, 
      placementManifest,
      generateForEdit = false, // If true, generate signals for inpainting edit
      editRegion, // Optional: specific region to mark as editable
    } = await req.json();

    console.log('Generating control signals for geometry:', {
      roomShape: geometryData?.roomShape,
      anchors: furnitureAnchors?.length || 0,
      placements: placementManifest?.items?.length || 0,
      editMode: generateForEdit,
    });

    if (!geometryData) {
      throw new Error('geometryData is required');
    }

    const anchors = furnitureAnchors || [];
    const placements = placementManifest?.items || [];

    // Generate all control signal descriptions
    const controlSignals: ControlSignals = {
      depthMapDescription: generateDepthMapDescription(geometryData),
      edgeMapDescription: generateEdgeMapDescription(geometryData),
      regionMaskDescription: generateRegionMaskDescription(geometryData, anchors, placements),
      structuralConstraints: generateStructuralConstraints(geometryData),
      furniturePlacementGuide: generateFurniturePlacementGuide(anchors, placements),
      lockingInstructions: `
LOCKING DIRECTIVE:

LOCKED (CANNOT CHANGE):
✗ Room boundary shape
✗ Window count: ${geometryData.windows.length}
✗ Window positions: ${geometryData.windows.map((w: {wall: string; positionPercent: number}) => `${w.wall}@${w.positionPercent}%`).join(', ')}
✗ Door count: ${geometryData.doors.length}
✗ Door positions: ${geometryData.doors.map((d: {wall: string; positionPercent: number}) => `${d.wall}@${d.positionPercent}%`).join(', ')}
✗ Camera angle (isometric from southeast)
✗ Room proportions (${geometryData.dimensions.width}:${geometryData.dimensions.depth})

UNLOCKED (CAN GENERATE):
✓ Furniture within designated anchors
✓ Wall textures/colors
✓ Floor materials
✓ Decorative elements within zones
✓ Lighting fixtures
✓ Window treatments (curtains, blinds)
`,
    };

    // For edit mode, add specific edit region instructions
    if (generateForEdit && editRegion) {
      controlSignals.regionMaskDescription += `
ACTIVE EDIT REGION:
- Position: (${editRegion.x}%, ${editRegion.y}%)
- Size: ${editRegion.width}% × ${editRegion.height}%
- This region is WHITE (editable)
- ALL other regions are BLACK (preserved)
- Use inpainting with low denoise (0.15-0.3)
`;
    }

    // Compile into a single control prompt
    const compiledControlPrompt = `
═══════════════════════════════════════════════════════════════
           CONTROL SIGNALS FOR CONSTRAINED GENERATION
═══════════════════════════════════════════════════════════════

${controlSignals.structuralConstraints}

${controlSignals.depthMapDescription}

${controlSignals.edgeMapDescription}

${controlSignals.regionMaskDescription}

${controlSignals.furniturePlacementGuide}

${controlSignals.lockingInstructions}

═══════════════════════════════════════════════════════════════
                    END OF CONTROL SIGNALS
═══════════════════════════════════════════════════════════════
`;

    console.log('Control signals generated successfully');

    return new Response(JSON.stringify({ 
      controlSignals,
      compiledControlPrompt,
      success: true,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('generate-control-signals error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
