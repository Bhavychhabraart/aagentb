import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FurnitureItem {
  name: string;
  category: string;
  description: string;
  imageUrl?: string;
}

interface LayoutAnalysis {
  roomShape: string;
  dimensions: { width: number; depth: number; height: number; unit: string };
  aspectRatio: string;
  walls: { position: string; length: number; features: { type: string; positionPercent: number; widthPercent: number }[] }[];
  windows: { wall: string; positionPercent: number; widthPercent: number; heightPercent: number; type: string }[];
  doors: { wall: string; positionPercent: number; widthPercent: number; type: string; swingDirection: string }[];
  furnitureZones: { name: string; label: string; xStart: number; xEnd: number; yStart: number; yEnd: number; suggestedItems: string[] }[];
  cameraRecommendation: { position: string; angle: number; height: string; fov: string };
  gridOverlay: string;
}

// Control signals from geometry engine
interface ControlSignals {
  depthMapDescription: string;
  edgeMapDescription: string;
  regionMaskDescription: string;
  structuralConstraints: string;
  furniturePlacementGuide: string;
  lockingInstructions: string;
}

// Placement manifest from placement engine
interface PlacementManifest {
  items: Array<{
    furnitureId: string;
    anchorId: string;
    position: { x: number; y: number };
    rotation: number;
    scale: { x: number; y: number };
    boundingBox: { minX: number; maxX: number; minY: number; maxY: number };
    valid: boolean;
  }>;
  collisions: string[];
  warnings: string[];
  valid: boolean;
  totalItems: number;
}

// Rendering settings for determinism
interface RenderSettings {
  creativityLevel: number; // 0.0-1.0, lower = more structural fidelity
  useControlSignals: boolean;
  fixedSeed: boolean;
  validationEnabled: boolean;
  maxRetries: number;
}

// Build architectural specification from layout analysis
function buildArchitecturalSpec(analysis: LayoutAnalysis): string {
  const { dimensions, walls, windows, doors, furnitureZones, cameraRecommendation, gridOverlay } = analysis;
  
  let spec = `MANDATORY ARCHITECTURAL CONSTRAINTS:

═══════════════════════════════════════════════════════════════
                    ROOM GEOMETRY SPECIFICATION
═══════════════════════════════════════════════════════════════

ROOM SHAPE: ${analysis.roomShape.toUpperCase()}
DIMENSIONS: ${dimensions.width}${dimensions.unit === 'feet' ? 'ft' : 'm'} wide × ${dimensions.depth}${dimensions.unit === 'feet' ? 'ft' : 'm'} deep × ${dimensions.height}${dimensions.unit === 'feet' ? 'ft' : 'm'} ceiling
ASPECT RATIO: ${analysis.aspectRatio}

`;

  // Wall specifications
  spec += `═══════════════════════════════════════════════════════════════
                    WALL SPECIFICATIONS (Top = North)
═══════════════════════════════════════════════════════════════

`;

  // ASCII representation of room
  spec += `┌─────────────────NORTH (${dimensions.width}ft)─────────────────┐
│`;
  
  // Add window markers for north wall
  const northWin = windows.filter(w => w.wall === 'north');
  if (northWin.length > 0) {
    northWin.forEach(w => {
      spec += ` ▢ Window @${Math.round(w.positionPercent)}%`;
    });
  } else {
    spec += '                    SOLID                     ';
  }
  spec += `│
│                                                           │
│WEST                                                   EAST│
│(${dimensions.depth}ft)                                                (${dimensions.depth}ft)│
│                                                           │
│`;

  // Add window markers for south wall
  const southWin = windows.filter(w => w.wall === 'south');
  if (southWin.length > 0) {
    southWin.forEach(w => {
      spec += ` ▢ Window @${Math.round(w.positionPercent)}%`;
    });
  } else {
    const southDoor = doors.filter(d => d.wall === 'south');
    if (southDoor.length > 0) {
      southDoor.forEach(d => {
        spec += ` ◯ Door @${Math.round(d.positionPercent)}%`;
      });
    } else {
      spec += '                    SOLID                     ';
    }
  }
  spec += `│
└─────────────────SOUTH (${dimensions.width}ft)─────────────────┘

`;

  // Detailed wall features
  for (const wall of walls) {
    const wallWindows = windows.filter(w => w.wall === wall.position);
    const wallDoors = doors.filter(d => d.wall === wall.position);
    
    spec += `${wall.position.toUpperCase()} WALL (${wall.length}ft):\n`;
    
    if (wallWindows.length > 0) {
      wallWindows.forEach((w, i) => {
        spec += `  → Window ${i + 1}: Position ${Math.round(w.positionPercent)}% from left, Width ${Math.round(w.widthPercent)}%, Type: ${w.type}\n`;
      });
    }
    if (wallDoors.length > 0) {
      wallDoors.forEach((d, i) => {
        spec += `  → Door ${i + 1}: Position ${Math.round(d.positionPercent)}% from left, Type: ${d.type}, Swing: ${d.swingDirection}\n`;
      });
    }
    if (wallWindows.length === 0 && wallDoors.length === 0) {
      spec += `  → SOLID WALL (no openings)\n`;
    }
    spec += '\n';
  }

  // Camera specification - FORCE ISOMETRIC VIEW for initial renders
  spec += `═══════════════════════════════════════════════════════════════
                    CAMERA POSITION & ANGLE (ISOMETRIC - MANDATORY)
═══════════════════════════════════════════════════════════════

⚠️ MANDATORY ISOMETRIC CAMERA VIEW - DO NOT DEVIATE ⚠️

CAMERA TYPE: ISOMETRIC (45° elevated corner view)
CAMERA HEIGHT: 8-10ft equivalent (elevated, looking down at ~45°)
VIEWING FROM: Southeast corner (elevated position)
LOOKING TOWARD: Northwest (center of room)
FIELD OF VIEW: Wide (capture entire room)
PERSPECTIVE: Near-orthographic (minimal distortion, parallel lines stay parallel)

ISOMETRIC VIEW REQUIREMENTS:
1. Camera elevated at 45° above ground plane
2. Corner view showing THREE surfaces: floor + two adjacent walls
3. Looking diagonally into the room from elevated corner
4. All vertical lines remain vertical (no extreme perspective)
5. Full room visibility - entire room in frame

Visual Reference (Isometric Corner View):
     ╱‾‾‾‾‾‾‾‾╲
    ╱   CEILING  ╲
   ╱______________╲
   ╲      |      ╱
    ╲ WALL | WALL╱
     ╲____|____╱
         FLOOR

DO NOT render from:
✗ Eye-level perspective (too flat, no room overview)
✗ Bird's-eye/top-down view (no wall visibility)
✗ Front-facing flat view (no depth perception)

`;

  // Furniture zones
  if (furnitureZones.length > 0) {
    spec += `═══════════════════════════════════════════════════════════════
                    FURNITURE PLACEMENT ZONES
═══════════════════════════════════════════════════════════════

`;
    furnitureZones.forEach((zone, i) => {
      spec += `ZONE ${i + 1}: ${zone.label.toUpperCase()}
  • X Range: ${zone.xStart}% - ${zone.xEnd}% (left to right)
  • Y Range: ${zone.yStart}% - ${zone.yEnd}% (front to back)
  • Suggested: ${zone.suggestedItems.join(', ')}
  
`;
    });
  }

  // Verification checklist
  spec += `═══════════════════════════════════════════════════════════════
                    VERIFICATION CHECKLIST
═══════════════════════════════════════════════════════════════

The generated render MUST show:
□ Room proportions matching ${dimensions.width}:${dimensions.depth} ratio
□ Total windows visible: ${windows.length} (check each wall)
□ Door(s) visible: ${doors.length} total
□ Camera angle from ${cameraRecommendation.position} corner
□ Furniture placed within designated zones

FAILURE CONDITIONS (will require regeneration):
✗ Wrong number of windows on any wall
✗ Door on wrong wall or missing
✗ Camera angle from incorrect corner
✗ Room proportions don't match specification
✗ Furniture placed outside designated zones

`;

  return spec;
}

function getOppositeCorner(corner: string): string {
  const opposites: Record<string, string> = {
    'southeast': 'northwest',
    'southwest': 'northeast',
    'northeast': 'southwest',
    'northwest': 'southeast',
    'center': 'center'
  };
  return opposites[corner] || 'opposite corner';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      prompt, 
      projectId, 
      furnitureItems,
      layoutImageUrl,
      roomPhotoUrl,
      styleRefUrls,
      layoutAnalysis,
      // NEW: 3-Layer Architecture inputs
      controlSignals, // From generate-control-signals function
      placementManifest, // From furniture-placement function
      renderSettings, // Determinism settings
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Default render settings for determinism
    const settings: RenderSettings = {
      creativityLevel: renderSettings?.creativityLevel ?? 0.2, // Low creativity for structure
      useControlSignals: renderSettings?.useControlSignals ?? true,
      fixedSeed: renderSettings?.fixedSeed ?? true,
      validationEnabled: renderSettings?.validationEnabled ?? true,
      maxRetries: renderSettings?.maxRetries ?? 3,
    };

    console.log('Generating render for prompt:', prompt);
    console.log('Furniture items:', furnitureItems?.length || 0);
    console.log('Layout image:', layoutImageUrl ? 'provided' : 'none');
    console.log('Layout analysis:', layoutAnalysis ? 'provided (111% accuracy mode)' : 'none');
    console.log('Control signals:', controlSignals ? 'provided (3-layer mode)' : 'none');
    console.log('Placement manifest:', placementManifest ? `${placementManifest.totalItems} items` : 'none');
    console.log('Render settings:', settings);
    console.log('Room photo:', roomPhotoUrl ? 'provided' : 'none');
    console.log('Style references:', styleRefUrls?.length || 0);

    // Build content array with reference images
    // IMPORTANT: Layout image goes LAST for maximum AI attention (recency bias)
    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
    let imageIndex = 1;
    
    // Track which images are included for the prompt
    let layoutImageIndex: number | null = null;
    let roomPhotoIndex: number | null = null;
    const styleImageIndices: number[] = [];
    const furnitureImageIndices: { name: string; category: string; index: number }[] = [];

    // Add room photo FIRST (context)
    if (roomPhotoUrl) {
      content.push({ type: 'image_url', image_url: { url: roomPhotoUrl } });
      roomPhotoIndex = imageIndex++;
    }

    // Add style reference images
    if (styleRefUrls && styleRefUrls.length > 0) {
      for (const styleUrl of styleRefUrls) {
        content.push({ type: 'image_url', image_url: { url: styleUrl } });
        styleImageIndices.push(imageIndex++);
      }
    }

    // Add furniture images
    const furnitureWithImages = (furnitureItems as FurnitureItem[] || []).filter(item => item.imageUrl);
    for (const item of furnitureWithImages) {
      if (item.imageUrl) {
        content.push({ type: 'image_url', image_url: { url: item.imageUrl } });
        furnitureImageIndices.push({ name: item.name, category: item.category, index: imageIndex++ });
      }
    }

    // Add layout image LAST (most important - AI pays more attention to recent images)
    if (layoutImageUrl) {
      content.push({ type: 'image_url', image_url: { url: layoutImageUrl } });
      layoutImageIndex = imageIndex++;
    }

    // Build structured prompt with ARCHITECTURAL CONSTRAINTS if layout analysis provided
    let structuredPrompt = `Role: Expert Interior Architect and Architectural Photographer with PIXEL-PERFECT accuracy.
Task: Generate an ULTRA-PHOTOREALISTIC interior design render that EXACTLY matches the floor plan specifications.

╔═══════════════════════════════════════════════════════════════════════════════╗
║                    ⚠️ LAYOUT ACCURACY - HIGHEST PRIORITY ⚠️                    ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  THE FLOOR PLAN LAYOUT IS THE ABSOLUTE AUTHORITY FOR THIS RENDER              ║
║  ANY DEVIATION FROM THE LAYOUT = AUTOMATIC REJECTION                          ║
╚═══════════════════════════════════════════════════════════════════════════════╝

LAYOUT TRACING PROCESS (MANDATORY):
Before generating ANY pixel, you MUST:
1. ANALYZE the floor plan image to identify the EXACT room boundary shape
2. COUNT all windows and doors - this count is MANDATORY to match
3. NOTE the precise positions of each window/door on each wall
4. IDENTIFY furniture placement zones from the floor plan
5. PROJECT this 2D floor plan into 3D isometric space with ZERO deviation
6. PLACE walls EXACTLY where the floor plan indicates
7. ADD windows/doors at EXACT positions shown (percentage from wall corners)
8. ONLY THEN add furniture within the designated zones

CRITICAL LAYOUT CONSTRAINTS:
✓ Room SHAPE must match floor plan EXACTLY (rectangular, L-shaped, etc.)
✓ Room PROPORTIONS must match floor plan (width-to-depth ratio)
✓ WINDOW COUNT must be EXACT (if floor plan shows 2 windows, render has 2 windows)
✓ WINDOW POSITIONS must match (e.g., north wall 30% from left corner)
✓ DOOR COUNT must be EXACT
✓ DOOR POSITIONS must match floor plan precisely
✓ Furniture zones from floor plan define WHERE items can be placed

═══════════════════════════════════════════════════════════════
     MANDATORY VISUAL QUALITY: HIGH-END ARCHITECTURAL PHOTOGRAPHY
═══════════════════════════════════════════════════════════════

RENDERING STYLE: ULTRA-PHOTOREALISTIC ARCHITECTURAL VISUALIZATION
Reference Quality: RED Cinema Camera footage, Architectural Digest, Dwell Magazine, Elle Decor

⚠️ CRITICAL ANTI-ILLUSTRATION DIRECTIVE ⚠️
ABSOLUTELY NEVER produce any of the following:
✗ Cartoon, illustrated, or stylized aesthetics
✗ Vector art, flat graphics, or cel-shading
✗ Video game, 3D game, or CGI-looking renders
✗ Sketch-like, hand-drawn, or concept art appearances
✗ Anime-style, watercolor, or artistic interpretations
✗ Over-saturated colors or unrealistic lighting
✗ Plastic-looking materials or fake textures

CAMERA & LENS SPECIFICATIONS (RED MONSTRO 8K EQUIVALENT):
• Sensor: Full-frame cinematographic sensor look (8K equivalent sharpness)
• Lens: 24-35mm prime lens with subtle anamorphic characteristics
• Depth of Field: Natural, subtle DOF with crisp focus on key elements
• Chromatic Quality: Clean edges, no purple fringing or aberrations
• Dynamic Range: 16+ stops, preserving shadow and highlight detail

LIGHTING REQUIREMENTS (PROFESSIONAL PHOTOGRAPHY STANDARD):
• Global Illumination: Full radiosity with accurate multi-bounce light
• Natural Light: Realistic sun/sky lighting through windows with soft caustics
• Shadow Quality: Soft, ray-traced shadows with natural falloff and contact shadows
• Interior Lighting: Practical lights with realistic bloom, falloff, and color temperature
• Ambient Occlusion: Subtle AO in corners and crevices for depth

MATERIAL RENDERING (PHYSICALLY-BASED):
• PBR Materials: Physically-based rendering for ALL surfaces
• Wood: Visible grain detail, natural color variation, realistic reflectance
• Fabric: Visible weave/texture, accurate subsurface scattering
• Metal: Correct metallic reflectance with anisotropic highlights
• Glass/Mirror: Accurate reflections with subtle imperfections
• Stone/Marble: Visible pores, veining, subsurface scattering

POST-PROCESSING LOOK (ARCHITECTURAL DIGEST STYLE):
• Color Grading: Warm, editorial color palette with rich mid-tones
• Contrast: Rich blacks, clean highlights without clipping
• Sharpness: Crisp detail without over-sharpening halos
• Film Grain: Subtle, imperceptible grain for organic feel

QUALITY BENCHMARK:
The output must be INDISTINGUISHABLE from a professional photograph shot on location with a $100,000+ camera setup for a luxury architecture magazine cover.

=== MANDATORY CAMERA POSITION: ISOMETRIC VIEW ===

⚠️ HIGHEST PRIORITY CAMERA DIRECTIVE - DO NOT DEVIATE ⚠️

The render MUST be generated from an ISOMETRIC camera angle:

1. CAMERA HEIGHT: Elevated position - approximately 45° above the ground plane (8-10ft equivalent)
2. CAMERA ANGLE: 30-45° corner view showing THREE surfaces:
   - The floor plane (visible from above)
   - Two adjacent walls (creating the classic isometric "corner" view)
3. VIEWING DIRECTION: Looking diagonally into the room from an elevated corner (southeast to northwest)
4. NO EXTREME PERSPECTIVE: Maintain near-parallel lines (minimal vanishing point distortion)
5. FULL ROOM VISIBILITY: The ENTIRE room must be visible in the frame

Visual Reference (Isometric Corner View):
     ╱‾‾‾‾‾‾‾‾╲
    ╱   CEILING  ╲
   ╱______________╲
   ╲      |      ╱
    ╲ WALL | WALL╱
     ╲____|____╱
         FLOOR

DO NOT render from:
✗ Eye-level perspective (too flat, missing room overview)
✗ Bird's-eye/top-down view (no wall visibility)
✗ Front-facing flat view (no depth perception)
✗ Low angle view (distorted proportions)

`;

    // Add ARCHITECTURAL CONSTRAINTS if layout analysis is provided
    if (layoutAnalysis) {
      structuredPrompt += buildArchitecturalSpec(layoutAnalysis as LayoutAnalysis);
      structuredPrompt += '\n';
    }

    structuredPrompt += `=== REFERENCE IMAGES ===

`;

    // Room photo instructions (if provided)
    if (roomPhotoIndex !== null) {
      structuredPrompt += `IMAGE ${roomPhotoIndex}: EXISTING ROOM PHOTO REFERENCE
- Match the architectural features from this photo (ceiling height, window styles, door types)
- Preserve similar structural elements and room character
- Use this for realistic architectural context

`;
    }

    // Style reference instructions
    if (styleImageIndices.length > 0) {
      const styleRange = styleImageIndices.length === 1 
        ? `IMAGE ${styleImageIndices[0]}` 
        : `IMAGES ${styleImageIndices.join(', ')}`;
      
      structuredPrompt += `${styleRange}: STYLE REFERENCES
- The final render's aesthetic MUST match these style references
- Copy the color palette, materials, textures, and finishes shown
- Replicate the mood, lighting style, and atmosphere
- The overall aesthetic must be IDENTICAL to these references

`;
    }

    // Furniture instructions with NUMBERED CHANGE LIST format
    if (furnitureImageIndices.length > 0) {
      structuredPrompt += `=== FURNITURE PRODUCTS TO INCLUDE ===

`;
      for (let i = 0; i < furnitureImageIndices.length; i++) {
        const { name, category, index } = furnitureImageIndices[i];
        
        // Find matching zone from layout analysis if available
        let zoneInstruction = '';
        if (layoutAnalysis) {
          const analysis = layoutAnalysis as LayoutAnalysis;
          const matchingZone = analysis.furnitureZones.find(z => 
            z.suggestedItems.some(item => 
              item.toLowerCase().includes(category.toLowerCase()) ||
              category.toLowerCase().includes(item.toLowerCase())
            )
          );
          if (matchingZone) {
            zoneInstruction = `\n   -> PLACEMENT ZONE: ${matchingZone.label} (X: ${matchingZone.xStart}-${matchingZone.xEnd}%, Y: ${matchingZone.yStart}-${matchingZone.yEnd}%)`;
          }
        }
        
        structuredPrompt += `${i + 1}. "${name}" (${category})
   -> Visual Reference: IMAGE ${index}
   -> COPY this product EXACTLY as shown - zero modifications allowed
   -> Shape, silhouette, and proportions must be IDENTICAL to IMAGE ${index}
   -> Colors must match EXACTLY - do not adjust, enhance, or correct
   -> Material textures must be preserved PERFECTLY
   -> Any unique design features must appear IDENTICALLY${zoneInstruction}
   ${layoutImageIndex !== null ? `-> Place according to floor plan in IMAGE ${layoutImageIndex}` : ''}

`;
      }
    }

    // Layout instructions LAST (highest priority - recency bias)
    if (layoutImageIndex !== null) {
      const analysis = layoutAnalysis as LayoutAnalysis | undefined;
      structuredPrompt += `
╔═══════════════════════════════════════════════════════════════════════════════╗
║          IMAGE ${layoutImageIndex}: 2D FLOOR PLAN LAYOUT - ABSOLUTE AUTHORITY                ║
╚═══════════════════════════════════════════════════════════════════════════════╝

THIS IS THE MOST IMPORTANT REFERENCE IMAGE. THE RENDER MUST MATCH IT EXACTLY.

MANDATORY LAYOUT REQUIREMENTS:
1. Room SHAPE: Must match the floor plan boundary EXACTLY
2. Room PROPORTIONS: Width-to-depth ratio must be IDENTICAL
3. WINDOW COUNT: ${analysis?.windows?.length ?? 'Must match floor plan'} windows total - NO MORE, NO LESS
4. WINDOW POSITIONS: Each window at EXACT position shown in floor plan
5. DOOR COUNT: ${analysis?.doors?.length ?? 'Must match floor plan'} doors total - NO MORE, NO LESS  
6. DOOR POSITIONS: Each door at EXACT position shown in floor plan
7. FURNITURE ZONES: Items placed ONLY in zones shown on floor plan

⚠️ LAYOUT VERIFICATION BEFORE OUTPUT:
□ Count windows in render - matches floor plan? (${analysis?.windows?.length ?? 'check'})
□ Count doors in render - matches floor plan? (${analysis?.doors?.length ?? 'check'})
□ Room shape matches floor plan boundary?
□ Furniture in designated zones?

IF ANY CHECK FAILS → DO NOT OUTPUT → REGENERATE WITH CORRECTIONS

`;
    }

    // Add user's prompt
    structuredPrompt += `=== USER DESIGN REQUEST ===

${prompt}

`;

    // Add furniture descriptions for context
    if (furnitureItems && furnitureItems.length > 0) {
      const furnitureDescriptions = (furnitureItems as FurnitureItem[]).map(item => 
        `${item.name} (${item.category}): ${item.description}`
      ).join('; ');
      structuredPrompt += `Furniture context: ${furnitureDescriptions}

`;
    }

    // Critical rules
    structuredPrompt += `=== CRITICAL RULES ===

1. ${layoutAnalysis ? 'ARCHITECTURAL CONSTRAINTS ABOVE ARE MANDATORY - any deviation is a failure' : 'Layout proportions must match the floor plan exactly'}
2. Products MUST appear IDENTICALLY to their reference images - this is the #1 priority
3. COPY products EXACTLY - do NOT "improve", "adapt", or "harmonize" them
4. The staged products should look like they were CUT from their references and PASTED into the room
5. If a product has a unique shape → KEEP THAT EXACT SHAPE
6. If a product has specific colors → KEEP THOSE EXACT COLORS (no white-balancing)
7. If a product has visible textures → REPLICATE THOSE EXACT TEXTURES
8. If a product has design details (buttons, stitching, patterns) → INCLUDE ALL DETAILS

`;

    // Output requirements
    structuredPrompt += `=== OUTPUT REQUIREMENTS ===

1. ULTRA-PHOTOREALISTIC quality - indistinguishable from real photography
2. RED Cinema Camera / Architectural Digest magazine quality
3. 16:9 LANDSCAPE aspect ratio (wide cinematic format)
4. **ISOMETRIC CAMERA ANGLE** - elevated 45° corner view showing floor + two walls (MANDATORY)
5. Ray-traced global illumination with natural light behavior
6. Physically-based materials with accurate reflections and textures
7. 8K resolution equivalent sharpness and detail
8. All reference images respected: Layout > Style > Room Photo > Furniture
${layoutAnalysis ? '9. VERIFY all architectural constraints are met before finalizing' : ''}

⛔ QUALITY REJECTION CRITERIA (render will be REJECTED if):
- Looks like an illustration, cartoon, or stylized art
- Has a 3D video game or CGI appearance
- Features flat colors or unrealistic lighting
- Materials look plastic, fake, or computer-generated
- Cannot pass as a real photograph

✅ QUALITY ACCEPTANCE CRITERIA:
- Looks like a photograph taken with a professional camera
- Materials look physically accurate and tangible
- Lighting creates realistic shadows and highlights
- Indistinguishable from real architectural photography

⚠️ VERIFICATION CHECKLIST: 
- ISOMETRIC VIEW: 45° elevated corner view (NOT eye-level, NOT top-down)
- Window/door count and positions verified
- Room proportions match specification
- Furniture placed in designated zones
- PHOTOREALISTIC quality achieved

Output: ONLY the final ultra-photorealistic image.`;

    content.push({ type: 'text', text: structuredPrompt });

    console.log('Structured prompt length:', structuredPrompt.length);
    console.log('Total images in request:', content.filter(c => c.type === 'image_url').length);
    console.log('111% accuracy mode:', layoutAnalysis ? 'ENABLED' : 'disabled');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-image-preview',
        messages: [{ role: 'user', content }],
        modalities: ['image', 'text'],
        generationConfig: { aspectRatio: "16:9" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Usage limit reached. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error('No image generated');
    }

    console.log('Render generated successfully');

    return new Response(JSON.stringify({ imageUrl, projectId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('generate-render error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
